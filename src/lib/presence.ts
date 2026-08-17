import { useEffect, useState } from "react";
import { client, presences, Permission, Query, Role } from "./appwrite.ts";
import { channels, presenceIds } from "../config.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

// A drawn segment: color, width, erase flag, and a polyline of [x,y] points in
// the 760x430 canvas backing-store space.
export type Seg = { c: string; w: number; e: boolean; pts: [number, number][] };

function readMeta(payload: any): any | null {
  const m = payload?.metadata;
  if (!m) return null;
  if (typeof m === "string") {
    try {
      return JSON.parse(m);
    } catch {
      return null;
    }
  }
  return m;
}

const usersRW = () => [Permission.read(Role.users()), Permission.update(Role.users())];

// ----------------------------------------------------------------------------
// Canvas over Presence: the drawer upserts a room-scoped presence record whose
// metadata carries the latest stroke batch; guessers subscribe to it. Ephemeral
// and auto-expiring — no table, no history (late joiners see blank until the
// next stroke).
// ----------------------------------------------------------------------------
export function makeCanvasBroadcaster(roomId: string) {
  const presenceId = presenceIds.canvas(roomId);
  let seq = 0;
  let clearVersion = 0;

  async function push(segs: Seg[], clear = false) {
    seq += 1;
    if (clear) clearVersion += 1;
    try {
      await presences.upsert({
        presenceId,
        status: "drawing",
        metadata: { seq, clearVersion, segs },
        expiresAt: new Date(Date.now() + 30_000).toISOString(),
        permissions: usersRW(),
      });
    } catch {
      /* presence may be unavailable; drawing simply won't broadcast */
    }
  }

  return {
    send: (segs: Seg[]) => push(segs, false),
    clear: () => push([], true),
  };
}

export function subscribeCanvas(
  roomId: string,
  handlers: { apply: (segs: Seg[]) => void; clear: () => void },
): () => void {
  const presenceId = presenceIds.canvas(roomId);
  let lastSeq = 0;
  let lastClear = 0;
  let unsub = () => {};
  try {
    unsub = client.subscribe(channels.presence(presenceId), (evt: any) => {
      const meta = readMeta(evt.payload);
      if (!meta) return;
      if ((meta.clearVersion ?? 0) > lastClear) {
        lastClear = meta.clearVersion;
        handlers.clear();
      }
      if ((meta.seq ?? 0) > lastSeq) {
        lastSeq = meta.seq;
        if (Array.isArray(meta.segs) && meta.segs.length) handlers.apply(meta.segs);
      }
    });
  } catch {
    /* noop */
  }
  return () => {
    try {
      unsub();
    } catch {
      /* noop */
    }
  };
}

// ----------------------------------------------------------------------------
// Liveness: each player upserts an "online" presence (heartbeat) with their
// room + role; everyone subscribes to see who's connected. Best-effort — if the
// Presences API is unavailable the game still works, we just don't show dots.
// ----------------------------------------------------------------------------
export type Online = Record<string, { role: string; nickname: string }>;

export function usePresence(
  roomId: string | null,
  uid: string | null,
  role: string,
  nickname: string,
): Online {
  const [online, setOnline] = useState<Online>({});

  useEffect(() => {
    if (!roomId || !uid) return;
    let alive = true;
    const presenceId = presenceIds.user(uid);

    const beat = () =>
      presences
        .upsert({
          presenceId,
          status: "online",
          metadata: { roomId, role, nickname },
          expiresAt: new Date(Date.now() + 45_000).toISOString(),
          permissions: [
            Permission.read(Role.users()),
            Permission.update(Role.user(uid)),
            Permission.delete(Role.user(uid)),
          ],
        })
        .catch(() => {});

    const ingest = (pr: any) => {
      if (!pr || pr.status !== "online") return;
      const m = readMeta(pr);
      if (m?.roomId !== roomId) return;
      setOnline((prev) => ({ ...prev, [pr.$id]: { role: m.role, nickname: m.nickname } }));
    };

    beat();
    const hb = setInterval(beat, 15_000);

    presences
      .list({ queries: [Query.limit(100)] })
      .then((r: any) => {
        if (!alive) return;
        (r.presences || r.rows || r.documents || []).forEach(ingest);
      })
      .catch(() => {});

    let unsub = () => {};
    try {
      unsub = client.subscribe(channels.presences(), (evt: any) => {
        const pr = evt.payload || {};
        const isDelete = (evt.events || []).some((e: string) => e.endsWith(".delete"));
        if (isDelete) {
          setOnline((prev) => {
            const { [pr.$id]: _drop, ...rest } = prev;
            return rest;
          });
        } else {
          ingest(pr);
        }
      });
    } catch {
      /* noop */
    }

    return () => {
      alive = false;
      clearInterval(hb);
      try {
        unsub();
      } catch {
        /* noop */
      }
      presences.delete({ presenceId }).catch(() => {});
    };
  }, [roomId, uid, role, nickname]);

  return online;
}
