import type { ChatKind } from "../theme.ts";

export type Status = "lobby" | "pick" | "play" | "score" | "winner";

export type Room = {
  id: string;
  code: string;
  status: Status;
  hostId: string;
  maxPlayers: number;
  settings: { totalRounds: number; turnSeconds: number };
  turnOrder: string[];
  scores: Record<string, number>;
  turnIndex: number;
  round: number;
  pickerId: string;
  drawerId: string;
  guesserId: string;
  maskedWord: string;
  tier: string;
  points: number;
  revealWord: string;
  turnStartedAt: string | null;
  turnEndsAt: string | null;
};

export type Player = {
  id: string;
  roomId: string;
  userId: string;
  nickname: string;
  color: string;
  ready: boolean;
  isHost: boolean;
};

export type Message = {
  id: string;
  roomId: string;
  userId: string;
  nickname: string;
  kind: ChatKind;
  text: string;
  createdAt: string;
};

const j = <T,>(v: unknown, fallback: T): T => {
  try {
    return v ? (JSON.parse(String(v)) as T) : fallback;
  } catch {
    return fallback;
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseRoom(r: any): Room {
  return {
    id: r.$id,
    code: r.code,
    status: r.status,
    hostId: r.hostId,
    maxPlayers: r.maxPlayers ?? 16,
    settings: j(r.settingsJson, { totalRounds: 5, turnSeconds: 80 }),
    turnOrder: j<string[]>(r.turnOrderJson, []),
    scores: j<Record<string, number>>(r.scoresJson, {}),
    turnIndex: r.turnIndex ?? 0,
    round: r.round ?? 0,
    pickerId: r.pickerId ?? "",
    drawerId: r.drawerId ?? "",
    guesserId: r.guesserId ?? "",
    maskedWord: r.maskedWord ?? "",
    tier: r.tier ?? "",
    points: r.points ?? 0,
    revealWord: r.revealWord ?? "",
    turnStartedAt: r.turnStartedAt ?? null,
    turnEndsAt: r.turnEndsAt ?? null,
  };
}

export function parsePlayer(r: any): Player {
  return {
    id: r.$id,
    roomId: r.roomId,
    userId: r.userId,
    nickname: r.nickname,
    color: r.color ?? "#3d4f97",
    ready: !!r.ready,
    isHost: !!r.isHost,
  };
}

const KINDS = new Set(["chat", "wrong", "right", "sys"]);
export function parseMessage(r: any): Message {
  return {
    id: r.$id,
    roomId: r.roomId,
    userId: r.userId ?? "",
    nickname: r.nickname ?? "",
    kind: (KINDS.has(r.kind) ? r.kind : "chat") as ChatKind,
    text: r.text ?? "",
    createdAt: r.$createdAt ?? "",
  };
}
