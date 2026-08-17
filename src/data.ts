import { color } from "./theme.ts";
import type { Status } from "./lib/types.ts";
import { scoreForWord } from "./lib/score.ts";
import bank from "./words.json";

/** Phases shown in the read-only phase bar (screen is driven by room.status). */
export const PHASES: [Status, string][] = [
  ["lobby", "Lobby"],
  ["pick", "Pick"],
  ["play", "Play"],
  ["score", "Score"],
  ["winner", "Winner"],
];

export type Choice = {
  word: string;
  tier: string;
  points: number;
  letters: number;
  hint: string;
  bg: string;
};

const TIER_BG: Record<string, string> = {
  EASY: color.sky,
  MEDIUM: color.lavender,
  HARD: color.grid,
};

function toChoice(word: string, hint: string): Choice {
  const { tier, points } = scoreForWord(word);
  return {
    word,
    tier,
    points,
    letters: word.replace(/[^a-zA-Z]/g, "").length,
    hint,
    bg: TIER_BG[tier] ?? color.sky,
  };
}

/** Draw one EASY / MEDIUM / HARD suggestion from the JSON word bank.
 *  Points/tier are computed the same way the server scores, so the cards match. */
export function pickWordChoices(rand: () => number = Math.random): Choice[] {
  const all = bank.words.map((w) => toChoice(w.word, w.hint));
  const draw = (pool: Choice[]) => pool[Math.floor(rand() * pool.length)];
  const out: Choice[] = [];
  for (const tier of ["EASY", "MEDIUM", "HARD"]) {
    const pool = all.filter((c) => c.tier === tier && !out.includes(c));
    if (pool.length) out.push(draw(pool)!);
  }
  while (out.length < 3) {
    const c = draw(all.filter((x) => !out.includes(x))!);
    if (!c) break;
    out.push(c);
  }
  return out;
}

export const SWATCHES = [
  "#21242e", "#e60012", "#f68d1f", "#ecab37",
  "#206479", "#3d4f97", "#acace7", "#ffffff",
] as const;

export const BRUSHES: [string, number][] = [
  ["THIN", 3],
  ["MED", 6],
  ["FAT", 14],
];

/** Player avatar palette + a stable pick from a seed (userId). */
export const PALETTE = [
  "#e60012", "#f68d1f", "#206479", "#ecab37",
  "#acace7", "#3d4f97", "#a7282b", "#60619c",
];

export function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}
