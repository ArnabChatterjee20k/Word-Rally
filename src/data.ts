import { color, type ChatKind } from "./theme.ts";

export type Player = { name: string; color: string; score: number };

export const PLAYERS: Player[] = [
  { name: "ArcadeKid", color: "#e60012", score: 480 },
  { name: "PixelPam", color: "#f68d1f", score: 640 },
  { name: "Bit_Rot", color: "#206479", score: 300 },
  { name: "NoodleFox", color: "#ecab37", score: 520 },
  { name: "Quibble", color: "#acace7", score: 250 },
  { name: "MegaTron88", color: "#3d4f97", score: 410 },
  { name: "SockPuppet", color: "#a7282b", score: 180 },
  { name: "Zed", color: "#60619c", score: 360 },
];

export const MATCH = {
  roomCode: "K7QX",
  round: 3,
  totalRounds: 5,
  maxPlayers: 16,
  pickerName: "PixelPam",
  drawerName: "ArcadeKid",
  guesserName: "NoodleFox",
  revealWord: "ROCKET SHIP",
  maskedWord: "_ _ _ _ _ _   _ _ _ _",
  answer: "rocket ship",
  championName: "PixelPam",
  championScore: 640,
  championGuesses: 7,
} as const;

export type Screen =
  | "landing"
  | "lobby"
  | "pick"
  | "play"
  | "score"
  | "winner"
  | "chat";

export const SCREENS: [Screen, string][] = [
  ["landing", "Join"],
  ["lobby", "Lobby"],
  ["pick", "Pick Word"],
  ["play", "Play"],
  ["score", "Round End"],
  ["winner", "Winner"],
  ["chat", "Chat"],
];

export const WORD_CHOICES = [
  { word: "KITE", tier: "EASY", points: 60, letters: 4, hint: "object", bg: color.sky },
  { word: "ROCKET SHIP", tier: "MEDIUM", points: 120, letters: 10, hint: "vehicle", bg: color.lavender },
  { word: "STAGE FRIGHT", tier: "HARD", points: 200, letters: 11, hint: "abstract", bg: color.grid },
] as const;

export const SWATCHES = [
  "#21242e", "#e60012", "#f68d1f", "#ecab37",
  "#206479", "#3d4f97", "#acace7", "#ffffff",
] as const;

export const BRUSHES: [string, number][] = [
  ["THIN", 3],
  ["MED", 6],
  ["FAT", 14],
];

export type ChatMsg = { who: string; text: string; kind: ChatKind };

export const INITIAL_CHAT: ChatMsg[] = [
  { who: "Bit_Rot", text: "is it a vehicle?", kind: "chat" },
  { who: "NoodleFox", text: "ROCKET", kind: "wrong" },
  { who: "SYSTEM", text: "NoodleFox is close!", kind: "sys" },
  { who: "NoodleFox", text: "ROCKET SHIP", kind: "right" },
  { who: "Quibble", text: "nice one", kind: "chat" },
];

export function sortedPlayers(): Player[] {
  return PLAYERS.slice().sort((a, b) => b.score - a.score);
}
