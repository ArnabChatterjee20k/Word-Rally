import { Client, TablesDB, ID, Query, Permission, Role } from "node-appwrite";
import {
  normalize,
  scoreForWord,
  maskWord,
  classifyGuess,
  awards,
  rolesForTurn,
  roundForTurn,
  isMatchOver,
  makeRoomCode,
} from "./logic.js";

const DB = "wordrally";
const T = {
  rooms: "rooms",
  players: "players",
  secretWords: "secretWords",
  messages: "messages",
};

const DEFAULTS = { totalRounds: 5, turnSeconds: 80, maxPlayers: 16 };

// ---- helpers ---------------------------------------------------------------
const json = (v) => JSON.parse(v || "null");
const now = () => new Date();
const plusSeconds = (s) => new Date(Date.now() + s * 1000).toISOString();

function makeDb(req) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"] || process.env.APPWRITE_API_KEY);
  return new TablesDB(client);
}

const loadRoom = (db, roomId) => db.getRow({ databaseId: DB, tableId: T.rooms, rowId: roomId });

async function loadSecret(db, room) {
  const res = await db.listRows({
    databaseId: DB,
    tableId: T.secretWords,
    queries: [
      Query.equal("roomId", room.$id),
      Query.equal("turnIndex", room.turnIndex),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ],
  });
  return res.rows?.[0] ?? res.documents?.[0] ?? null;
}

function postMessage(db, roomId, kind, who, text) {
  return db.createRow({
    databaseId: DB,
    tableId: T.messages,
    rowId: ID.unique(),
    data: { roomId, userId: "server", nickname: who, kind, text },
  });
}

function roleFields(order, turnIndex) {
  const { pickerId, drawerId, guesserId } = rolesForTurn(order, turnIndex);
  return { pickerId, drawerId, guesserId };
}

// ---- action handlers -------------------------------------------------------
const actions = {
  async createRoom(db, uid, body) {
    const settings = {
      totalRounds: body?.settings?.totalRounds ?? DEFAULTS.totalRounds,
      turnSeconds: body?.settings?.turnSeconds ?? DEFAULTS.turnSeconds,
    };
    const maxPlayers = body?.maxPlayers ?? DEFAULTS.maxPlayers;
    const nickname = (body?.nickname || "Player").slice(0, 32);
    const color = body?.color || "#f68d1f";

    let room = null;
    for (let attempt = 0; attempt < 6 && !room; attempt++) {
      const code = makeRoomCode();
      try {
        room = await db.createRow({
          databaseId: DB,
          tableId: T.rooms,
          rowId: ID.unique(),
          data: {
            code,
            status: "lobby",
            hostId: uid,
            maxPlayers,
            settingsJson: JSON.stringify(settings),
            turnOrderJson: JSON.stringify([uid]),
            scoresJson: JSON.stringify({ [uid]: 0 }),
            turnIndex: 0,
            round: 0,
          },
          permissions: [Permission.read(Role.users())],
        });
      } catch (e) {
        if (e?.code !== 409) throw e; // 409 = code collided, retry
      }
    }
    if (!room) throw new Error("Could not allocate a room code, try again");

    await db.createRow({
      databaseId: DB,
      tableId: T.players,
      rowId: ID.unique(),
      data: { roomId: room.$id, userId: uid, nickname, color, ready: false, isHost: true },
      permissions: [
        Permission.read(Role.users()),
        Permission.update(Role.user(uid)),
        Permission.delete(Role.user(uid)),
      ],
    });

    return { roomId: room.$id, code: room.code };
  },

  async joinRoom(db, uid, body) {
    const code = (body?.code || "").trim().toUpperCase();
    const nickname = (body?.nickname || "Player").slice(0, 32);
    const color = body?.color || "#3d4f97";

    const found = await db.listRows({
      databaseId: DB,
      tableId: T.rooms,
      queries: [Query.equal("code", code), Query.limit(1)],
    });
    const room = found.rows?.[0] ?? found.documents?.[0];
    if (!room) throw new Error("No room with that code");
    if (room.status !== "lobby") throw new Error("That match has already started");

    const order = json(room.turnOrderJson) || [];
    if (order.includes(uid)) return { roomId: room.$id, code: room.code };
    if (order.length >= (room.maxPlayers || DEFAULTS.maxPlayers))
      throw new Error("Room is full");

    await db.createRow({
      databaseId: DB,
      tableId: T.players,
      rowId: ID.unique(),
      data: { roomId: room.$id, userId: uid, nickname, color, ready: false, isHost: false },
      permissions: [
        Permission.read(Role.users()),
        Permission.update(Role.user(uid)),
        Permission.delete(Role.user(uid)),
      ],
    });

    const scores = json(room.scoresJson) || {};
    scores[uid] = 0;
    order.push(uid);
    await db.updateRow({
      databaseId: DB,
      tableId: T.rooms,
      rowId: room.$id,
      data: { turnOrderJson: JSON.stringify(order), scoresJson: JSON.stringify(scores) },
    });

    return { roomId: room.$id, code: room.code };
  },

  async startMatch(db, uid, body) {
    const room = await loadRoom(db, body.roomId);
    if (room.hostId !== uid) throw new Error("Only the host can start");
    if (room.status !== "lobby") throw new Error("Match already started");
    const order = json(room.turnOrderJson) || [];
    if (order.length < 2) throw new Error("Need at least 2 players to start");

    await db.updateRow({
      databaseId: DB,
      tableId: T.rooms,
      rowId: room.$id,
      data: {
        status: "pick",
        turnIndex: 0,
        round: 1,
        revealWord: "",
        maskedWord: "",
        ...roleFields(order, 0),
      },
    });
    return { ok: true };
  },

  async pickWord(db, uid, body) {
    const room = await loadRoom(db, body.roomId);
    if (room.status !== "pick") throw new Error("Not in the pick phase");
    if (room.pickerId !== uid) throw new Error("It is not your turn to pick");

    const word = (body?.word || "").trim();
    if (!word) throw new Error("Word is empty");
    if (word.replace(/\s+/g, "").length > 12) throw new Error("Word too long (max 12 letters)");

    const { tier, points } = scoreForWord(word);
    const settings = json(room.settingsJson) || DEFAULTS;

    await db.createRow({
      databaseId: DB,
      tableId: T.secretWords,
      rowId: ID.unique(),
      data: { roomId: room.$id, turnIndex: room.turnIndex, word, tier, points },
      // Only the DRAWER may read the plaintext (they need it to draw). The guesser
      // and everyone else cannot — keeping the guess server-authoritative.
      permissions: [Permission.read(Role.user(room.drawerId))],
    });

    await db.updateRow({
      databaseId: DB,
      tableId: T.rooms,
      rowId: room.$id,
      data: {
        status: "play",
        maskedWord: maskWord(word),
        tier,
        points,
        revealWord: "",
        turnStartedAt: now().toISOString(),
        turnEndsAt: plusSeconds(settings.turnSeconds ?? DEFAULTS.turnSeconds),
      },
    });
    return { ok: true };
  },

  async submitGuess(db, uid, body) {
    const room = await loadRoom(db, body.roomId);
    if (room.status !== "play") throw new Error("No live turn");
    if (room.guesserId !== uid) throw new Error("You are not the guesser this turn");

    // Server-authoritative timer: a late guess ends the turn with no award.
    if (room.turnEndsAt && now() >= new Date(room.turnEndsAt)) {
      await endTurnInternal(db, room);
      return { result: "timeout" };
    }

    const secret = await loadSecret(db, room);
    if (!secret) throw new Error("No word set for this turn");

    const nickname = (body?.nickname || "Guesser").slice(0, 32);
    const result = classifyGuess(body?.guess, secret.word);

    if (result === "exact") {
      const scores = json(room.scoresJson) || {};
      const a = awards(secret.points);
      scores[room.guesserId] = (scores[room.guesserId] || 0) + a.guesser;
      scores[room.drawerId] = (scores[room.drawerId] || 0) + a.drawer;
      scores[room.pickerId] = (scores[room.pickerId] || 0) + a.picker;

      await postMessage(db, room.$id, "right", nickname, secret.word.toUpperCase());
      await db.updateRow({
        databaseId: DB,
        tableId: T.rooms,
        rowId: room.$id,
        data: {
          status: "score",
          revealWord: secret.word.toUpperCase(),
          scoresJson: JSON.stringify(scores),
        },
      });
    } else if (result === "near") {
      await postMessage(db, room.$id, "wrong", nickname, body.guess);
      await postMessage(db, room.$id, "sys", "SYSTEM", `${nickname} is close!`);
    } else {
      await postMessage(db, room.$id, "wrong", nickname, body.guess);
    }
    return { result };
  },

  async endTurn(db, uid, body) {
    const room = await loadRoom(db, body.roomId);
    if (room.status !== "play") throw new Error("No live turn");
    const expired = room.turnEndsAt && now() >= new Date(room.turnEndsAt);
    if (room.drawerId !== uid && !expired) throw new Error("Only the drawer can end the turn");
    await endTurnInternal(db, room);
    return { ok: true };
  },

  async nextTurn(db, uid, body) {
    const room = await loadRoom(db, body.roomId);
    if (room.status !== "score") throw new Error("Turn is not over");
    const order = json(room.turnOrderJson) || [];
    if (!order.includes(uid)) throw new Error("Not a member of this room");
    const settings = json(room.settingsJson) || DEFAULTS;
    const n = order.length;
    const next = room.turnIndex + 1;

    if (isMatchOver(next, n, settings.totalRounds ?? DEFAULTS.totalRounds)) {
      await db.updateRow({
        databaseId: DB,
        tableId: T.rooms,
        rowId: room.$id,
        data: { status: "winner" },
      });
      return { status: "winner" };
    }

    await db.updateRow({
      databaseId: DB,
      tableId: T.rooms,
      rowId: room.$id,
      data: {
        status: "pick",
        turnIndex: next,
        round: roundForTurn(next, n),
        maskedWord: "",
        revealWord: "",
        tier: "",
        points: 0,
        turnStartedAt: null,
        turnEndsAt: null,
        ...roleFields(order, next),
      },
    });
    return { status: "pick" };
  },

  async rematch(db, uid, body) {
    const room = await loadRoom(db, body.roomId);
    if (room.hostId !== uid) throw new Error("Only the host can rematch");
    const order = json(room.turnOrderJson) || [];
    const scores = Object.fromEntries(order.map((id) => [id, 0]));
    await db.updateRow({
      databaseId: DB,
      tableId: T.rooms,
      rowId: room.$id,
      data: {
        status: "lobby",
        turnIndex: 0,
        round: 0,
        scoresJson: JSON.stringify(scores),
        maskedWord: "",
        revealWord: "",
      },
    });
    return { ok: true };
  },

  async endMatch(db, uid, body) {
    const room = await loadRoom(db, body.roomId);
    if (room.hostId !== uid) throw new Error("Only the host can end the match");
    if (room.status === "lobby") throw new Error("No match in progress");
    await db.updateRow({ databaseId: DB, tableId: T.rooms, rowId: room.$id, data: { status: "winner" } });
    return { ok: true };
  },

  async leaveRoom(db, uid, body) {
    const room = await loadRoom(db, body.roomId);

    // Remove the player's own row (roster + presence cleanup).
    const pl = await db.listRows({
      databaseId: DB,
      tableId: T.players,
      queries: [Query.equal("roomId", room.$id), Query.equal("userId", uid), Query.limit(1)],
    });
    const row = pl.rows?.[0] ?? pl.documents?.[0];
    if (row) await db.deleteRow({ databaseId: DB, tableId: T.players, rowId: row.$id }).catch(() => {});

    let order = json(room.turnOrderJson) || [];
    const scores = json(room.scoresJson) || {};
    const data = {};

    if (room.status === "lobby") {
      // Safe to fully remove before the match starts.
      order = order.filter((id) => id !== uid);
      delete scores[uid];
      data.turnOrderJson = JSON.stringify(order);
      data.scoresJson = JSON.stringify(scores);
    } else {
      // Mid-match: keep turnOrder/scores intact (ids must stay consistent with the
      // stored roles). End the match if a turn actor leaves or too few remain.
      const remaining = order.filter((id) => id !== uid).length;
      if (uid === room.pickerId || uid === room.drawerId || remaining < 2) data.status = "winner";
    }

    // Hand off host if the host left.
    if (uid === room.hostId) {
      const pool = (data.turnOrderJson ? JSON.parse(data.turnOrderJson) : order).filter((id) => id !== uid);
      if (pool.length) data.hostId = pool[0];
    }

    if (Object.keys(data).length)
      await db.updateRow({ databaseId: DB, tableId: T.rooms, rowId: room.$id, data });
    return { ok: true };
  },
};

async function endTurnInternal(db, room) {
  const secret = await loadSecret(db, room);
  await db.updateRow({
    databaseId: DB,
    tableId: T.rooms,
    rowId: room.$id,
    data: { status: "score", revealWord: secret ? secret.word.toUpperCase() : "" },
  });
}

// ---- entrypoint ------------------------------------------------------------
export default async ({ req, res, error }) => {
  try {
    const uid = req.headers["x-appwrite-user-id"];
    if (!uid) return res.json({ error: "Not authenticated" }, 401);

    const body = req.bodyJson ?? (req.body ? JSON.parse(req.body) : {});
    const action = body?.action;
    const handler = actions[action];
    if (!handler) return res.json({ error: `Unknown action: ${action}` }, 400);

    const db = makeDb(req);
    const out = await handler(db, uid, body);
    return res.json({ ok: true, ...out });
  } catch (e) {
    error(e?.message || String(e));
    return res.json({ error: e?.message || "Server error" }, 400);
  }
};
