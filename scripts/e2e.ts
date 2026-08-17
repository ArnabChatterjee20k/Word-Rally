/**
 * End-to-end driver: runs a full Word Rally match against the live Appwrite Cloud
 * project using three anonymous sessions — exactly as three browsers would, calling
 * the deployed `game` function. Verifies the happy path + server-authority guarantees.
 *
 * Sessions are minted server-side with an ephemeral API key (WR_KEY) — the only way to
 * obtain a real session secret outside a browser — then each guest acts via setSession,
 * exactly reproducing a logged-in browser calling the deployed `game` function.
 *
 *   WR_KEY=<ephemeral-key> bun run scripts/e2e.ts
 */
import { Client, Account, Functions, TablesDB, Query } from "node-appwrite";

declare const process: { env: Record<string, string | undefined> };

const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const PROJECT = "69df74c0000a309ef8af";
const DB = "wordrally";
const FN = "game";
const WORD = "ROCKET SHIP";

const admin = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(process.env.WR_KEY || "");

let passed = 0;
let failed = 0;
function check(label: string, ok: boolean, extra = "") {
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${extra ? ` — ${extra}` : ""}`);
}

type Guest = { uid: string; nick: string; fns: Functions; db: TablesDB };

async function guest(nick: string): Promise<Guest> {
  const s = await new Account(admin).createAnonymousSession();
  const c = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setSession(s.secret);
  return { uid: s.userId, nick, fns: new Functions(c), db: new TablesDB(c) };
}

async function call(g: Guest, action: string, payload: Record<string, unknown> = {}): Promise<any> {
  const ex = await g.fns.createExecution({ functionId: FN, body: JSON.stringify({ action, ...payload }) });
  let out: any = {};
  try {
    out = JSON.parse(ex.responseBody || "{}");
  } catch {
    throw new Error(`${action}: non-JSON response: ${(ex.responseBody || "").slice(0, 200)}`);
  }
  if (out.error) throw new Error(`${action}: ${out.error}`);
  return out;
}

const getRoom = (g: Guest, roomId: string): Promise<any> =>
  g.db.getRow({ databaseId: DB, tableId: "rooms", rowId: roomId });

async function main() {
  console.log("→ Creating three anonymous guests…");
  const A = await guest("HostAmy");
  const B = await guest("BobDraw");
  const C = await guest("CaraGuess");
  const byUid: Record<string, Guest> = { [A.uid]: A, [B.uid]: B, [C.uid]: C };
  check("three anonymous sessions", !!(A.uid && B.uid && C.uid), `${A.uid.slice(0, 6)}…`);

  console.log("→ Lobby: create + join…");
  const { roomId, code } = await call(A, "createRoom", {
    nickname: A.nick,
    color: "#f68d1f",
    settings: { totalRounds: 1, turnSeconds: 120 },
    maxPlayers: 16,
  });
  check("createRoom returns room + code", !!roomId && /^[A-Z2-9]{4}$/.test(code), `code=${code}`);
  await call(B, "joinRoom", { code, nickname: B.nick, color: "#206479" });
  await call(C, "joinRoom", { code, nickname: C.nick, color: "#ecab37" });
  let room = await getRoom(A, roomId);
  check("3 players in turnOrder", JSON.parse(room.turnOrderJson).length === 3);

  console.log("→ Start match…");
  await call(A, "startMatch", { roomId });
  room = await getRoom(A, roomId);
  check("status → pick after start", room.status === "pick");
  check("distinct picker/drawer/guesser", new Set([room.pickerId, room.drawerId, room.guesserId]).size === 3);

  let secLobby = false;
  try {
    await call(B, "startMatch", { roomId });
  } catch {
    secLobby = true;
  }
  check("non-host / already-started startMatch rejected", secLobby);

  let turn = 0;
  while (turn < 10) {
    room = await getRoom(A, roomId);
    if (room.status === "winner") break;

    if (room.status === "pick") {
      const picker = byUid[room.pickerId]!;
      await call(picker, "pickWord", { roomId, word: WORD });
      room = await getRoom(A, roomId);
      check(`turn ${turn}: pickWord → play`, room.status === "play");
      check(`turn ${turn}: word masked`, room.maskedWord.includes("_"));

      const drawer = byUid[room.drawerId]!;
      const guesser = byUid[room.guesserId]!;
      const secQ = [Query.equal("roomId", roomId), Query.equal("turnIndex", room.turnIndex), Query.limit(1)];
      const drawerView: any = await drawer.db.listRows({ databaseId: DB, tableId: "secretWords", queries: secQ });
      const guesserView: any = await guesser.db.listRows({ databaseId: DB, tableId: "secretWords", queries: secQ });
      const drawerRows = drawerView.rows || drawerView.documents || [];
      const guesserRows = guesserView.rows || guesserView.documents || [];
      check(`turn ${turn}: DRAWER can read secret`, drawerRows.length === 1 && drawerRows[0].word === WORD);
      check(`turn ${turn}: GUESSER cannot read secret`, guesserRows.length === 0);

      let rejected = false;
      try {
        await call(drawer, "submitGuess", { roomId, guess: WORD, nickname: "cheater" });
      } catch {
        rejected = true;
      }
      check(`turn ${turn}: non-guesser guess rejected`, rejected);

      const wrong = await call(guesser, "submitGuess", { roomId, guess: "banana", nickname: guesser.nick });
      check(`turn ${turn}: wrong guess classified`, wrong.result === "wrong");
      room = await getRoom(A, roomId);
      check(`turn ${turn}: still in play after wrong`, room.status === "play");

      const before = JSON.parse(room.scoresJson);
      const right = await call(guesser, "submitGuess", { roomId, guess: "rocket ship", nickname: guesser.nick });
      check(`turn ${turn}: exact guess accepted`, right.result === "exact");
      room = await getRoom(A, roomId);
      const after = JSON.parse(room.scoresJson);
      check(`turn ${turn}: status → score`, room.status === "score");
      check(`turn ${turn}: reveal word set`, room.revealWord === WORD);
      check(
        `turn ${turn}: scores awarded (g/d/p)`,
        after[room.guesserId] > (before[room.guesserId] ?? 0) &&
          after[room.drawerId] > (before[room.drawerId] ?? 0) &&
          after[room.pickerId] > (before[room.pickerId] ?? 0),
        `guesser=${after[room.guesserId]} drawer=${after[room.drawerId]} picker=${after[room.pickerId]}`,
      );
    }

    if (room.status === "score") {
      await call(A, "nextTurn", { roomId });
      turn++;
    }
  }

  room = await getRoom(A, roomId);
  check("match reaches winner", room.status === "winner");
  console.log("   final scores:", JSON.parse(room.scoresJson));

  console.log("→ Rematch resets to lobby…");
  await call(A, "rematch", { roomId });
  room = await getRoom(A, roomId);
  const reset = JSON.parse(room.scoresJson);
  check("rematch → lobby, scores zeroed", room.status === "lobby" && Object.values(reset).every((v) => v === 0));

  console.log("→ 2-player match (picker also draws)…");
  const D = await guest("Duo1");
  const E = await guest("Duo2");
  const byUid2: Record<string, Guest> = { [D.uid]: D, [E.uid]: E };
  const two = await call(D, "createRoom", { nickname: D.nick, settings: { totalRounds: 1, turnSeconds: 120 } });
  await call(E, "joinRoom", { code: two.code, nickname: E.nick });
  await call(D, "startMatch", { roomId: two.roomId });
  let r2 = await getRoom(D, two.roomId);
  check("2p: picker also draws (roles collapse)", r2.pickerId === r2.drawerId);
  check("2p: guesser is the other player", r2.guesserId !== r2.pickerId && !!r2.guesserId);
  let t = 0;
  while (t < 6) {
    r2 = await getRoom(D, two.roomId);
    if (r2.status === "winner") break;
    if (r2.status === "pick") {
      await call(byUid2[r2.pickerId]!, "pickWord", { roomId: two.roomId, word: WORD });
      r2 = await getRoom(D, two.roomId);
      await call(byUid2[r2.guesserId]!, "submitGuess", { roomId: two.roomId, guess: "rocket ship", nickname: "g" });
    }
    r2 = await getRoom(D, two.roomId);
    if (r2.status === "score") {
      await call(D, "nextTurn", { roomId: two.roomId });
      t++;
    }
  }
  r2 = await getRoom(D, two.roomId);
  check("2p: match reaches winner", r2.status === "winner");

  console.log(`\n${failed === 0 ? "✅" : "❌"} E2E: ${passed} passed, ${failed} failed`);
  if (failed > 0) throw new Error(`${failed} checks failed`);
}

await main();
