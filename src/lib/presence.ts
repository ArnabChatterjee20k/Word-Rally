import { useEffect, useState } from "react";
import { presences, realtime, Permission, Query, Role } from "./appwrite.ts";
import { channels, presenceIds } from "../config.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

// A drawn segment: color, width, erase flag, and a polyline of [x,y] points in
// the 760x430 canvas backing-store space.
export type Seg = { c: string; w: number; e: boolean; pts: [number, number][] };

// Presence realtime payloads vary by shape: metadata may be an object or a JSON
// string, may sit at payload.metadata or payload.data.metadata, or the payload may
// already BE the metadata. Normalize all of those to a plain object.
function readMeta(payload: any): any | null {
  if (!payload) return null;
  let m = payload.metadata ?? payload.data?.metadata;
  if (m === undefined && (payload.seq !== undefined || payload.d !== undefined)) m = payload;
  if (m == null) return null;
  if (typeof m === "string") {
    try {
      m = JSON.parse(m);
    } catch {
      return null;
    }
  }
  return m;
}

const selfPerms = (uid: string) => [
  Permission.read(Role.users()),
  Permission.update(Role.user(uid)),
  Permission.delete(Role.user(uid)),
];

// ----------------------------------------------------------------------------
// Canvas over Presence, on the shared Realtime socket. Socket presence is keyed by
// the sender's user id, so the DRAWER carries strokes in its OWN user presence;
// guessers subscribe to presences.<drawerId>. We keep the liveness fields
// (roomId/role/nickname) in the metadata too, so the roster still sees the drawer
// as online while drawing. Ephemeral, auto-expiring, no table, no HTTP per stroke.
// ----------------------------------------------------------------------------
export function makeCanvasBroadcaster(uid: string, roomId: string, nickname: string) {
  let seq = 0;
  let clearVersion = 0;

  const push = (segs: Seg[], clear = false) => {
    seq += 1;
    if (clear) clearVersion += 1;
    // strokes JSON-stringified so nested point arrays survive the round-trip.
    realtime
      .upsertPresence({
        presenceId: uid,
        status: "online",
        metadata: { roomId, role: "drawer", nickname, seq, clearVersion, d: JSON.stringify(segs) },
        permissions: selfPerms(uid),
      })
      .catch(() => {});
  };

  return {
    send: (segs: Seg[]) => push(segs, false),
    clear: () => push([], true),
  };
}

export function subscribeCanvas(
  drawerId: string,
  handlers: { apply: (segs: Seg[]) => void; clear: () => void },
): () => void {
  let lastSeq = 0;
  let lastClear = 0;
  let sub: any = null;
  let closed = false;

  realtime
    .subscribe(channels.drawerPresence(drawerId), (evt: any) => {
      const meta = readMeta(evt.payload);
      if (!meta) return;
      if ((meta.clearVersion ?? 0) > lastClear) {
        lastClear = meta.clearVersion;
        handlers.clear();
      }
      if ((meta.seq ?? 0) > lastSeq) {
        lastSeq = meta.seq;
        let segs: Seg[] = [];
        try {
          segs = meta.d ? JSON.parse(meta.d) : Array.isArray(meta.segs) ? meta.segs : [];
        } catch {
          segs = [];
        }
        if (segs.length) handlers.apply(segs);
      }
    })
    .then((s) => {
      if (closed) s.unsubscribe();
      else sub = s;
    })
    .catch(() => {});

  return () => {
    closed = true;
    if (sub) {
      try {
        sub.unsubscribe();
      } catch {
        /* noop */
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Liveness: each player upserts an "online" presence over the socket (no
// heartbeat — it auto-expires when the tab disconnects). Everyone subscribes to
// the presences channel to render who's connected. Seeded once over HTTP so a
// late joiner sees players who announced before they connected.
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
    let cancelled = false;
    let sub: any = null;
    const presenceId = presenceIds.user(uid);

    const drop = (id: string) =>
      setOnline((prev) => {
        if (!(id in prev)) return prev;
        const { [id]: _gone, ...rest } = prev;
        return rest;
      });

    const ingest = (pr: any) => {
      if (!pr) return;
      const m = readMeta(pr);
      if (pr.status !== "online" || m?.roomId !== roomId) return drop(pr.$id);
      setOnline((prev) => ({ ...prev, [pr.$id]: { role: m.role, nickname: m.nickname } }));
    };

    realtime
      .upsertPresence({
        presenceId,
        status: "online",
        metadata: { roomId, role, nickname },
        permissions: [
          Permission.read(Role.users()),
          Permission.update(Role.user(uid)),
          Permission.delete(Role.user(uid)),
        ],
      })
      .catch(() => {});

    presences
      .list({ queries: [Query.limit(100)] })
      .then((r: any) => {
        if (!cancelled) (r.presences || r.rows || r.documents || []).forEach(ingest);
      })
      .catch(() => {});

    realtime
      .subscribe(channels.presences(), (evt: any) => {
        const isDelete = (evt.events || []).some((e: string) => e.endsWith(".delete"));
        if (isDelete) drop((evt.payload || {}).$id);
        else ingest(evt.payload);
      })
      .then((s) => {
        if (cancelled) s.unsubscribe();
        else sub = s;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (sub) {
        try {
          sub.unsubscribe();
        } catch {
          /* noop */
        }
      }
      // Announce we've left this room (socket-bound presence also clears on disconnect).
      realtime
        .upsertPresence({ presenceId, status: "away", metadata: { roomId: "", role, nickname } })
        .catch(() => {});
    };
  }, [roomId, uid, role, nickname]);

  return online;
}
