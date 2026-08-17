import type { CSSProperties } from "react";

/**
 * Word Rally design tokens — the single source of truth for the look.
 * Mirrors design.md. Change a value here and it propagates everywhere.
 */

// ---- Palette ---------------------------------------------------------------
export const color = {
  ink: "#21242e", // near-black outline / text
  inkSoft: "#60619c", // muted purple-grey dividers & secondary text
  white: "#ffffff",
  panel: "#dedede", // raised grey panel face

  base: "#7a8aba", // app background blue
  grid: "#8ba1d4", // dot-grid highlight / mid blue
  sky: "#9fbee7", // light blue fills
  lavender: "#acace7", // hero / soft purple

  royal: "#3d4f97", // structural blue (borders, links)

  orange: "#f68d1f", // PRIMARY action accent
  gold: "#ecab37", // secondary / badge amber
  red: "#e60012", // scores, alerts, room code
  teal: "#206479", // "pick" mode banner
  crimson: "#a7282b", // winner banner
} as const;

// Named bevel edge pairs (top-left highlight / bottom-right shadow)
export const edge = {
  gold: ["#f7dfa8", "#a9721a"],
  orange: ["#ffc98a", "#a8560a"],
  panel: ["#ffffff", "#3d4f97"],
  blue: ["#c3d2f0", "#3d4f97"],
  lavender: ["#c9c9f4", "#3d4f97"],
  teal: ["#4c94a8", "#0d2f3a"],
  crimson: ["#d4666a", "#58090b"],
  sky: ["#e6f0f8", "#3d4f97"],
  dark: ["#565b74", "#05060a"],
  code: ["#3d4f97", "#c9d6ef"],
} as const;

// ---- Type ------------------------------------------------------------------
export const font = {
  body: "Arial, Helvetica, sans-serif",
  display: "'Archivo Black', 'Arial Black', sans-serif",
  pixel: "Silkscreen, monospace",
} as const;

// ---- Helpers ---------------------------------------------------------------
/** Four-sided raised/inset bevel from a highlight + shadow pair. */
export function bevel(pair: readonly [string, string], w = 2): CSSProperties {
  const [tl, br] = pair;
  return {
    borderTop: `${w}px solid ${tl}`,
    borderLeft: `${w}px solid ${tl}`,
    borderRight: `${w}px solid ${br}`,
    borderBottom: `${w}px solid ${br}`,
  };
}

/** Top/bottom-only bevel (used by the flat dark & orange bars). */
export function bevelY(pair: readonly [string, string], w = 2): CSSProperties {
  const [t, b] = pair;
  return { borderTop: `${w}px solid ${t}`, borderBottom: `${w}px solid ${b}` };
}

/** Dot-grid background used on the app shell and dark strips. */
export function dots(dot: string, size = 4): CSSProperties {
  return {
    backgroundImage: `radial-gradient(${dot} 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
  };
}

/** The chunky italic display title with hard drop-shadow. */
export function displayTitle(
  size: number,
  shadow: string,
  strokeW = 3,
): CSSProperties {
  return {
    fontFamily: font.display,
    fontSize: size,
    lineHeight: 1,
    color: color.white,
    WebkitTextStroke: `${strokeW}px ${color.ink}`,
    textShadow: `${strokeW + 2}px ${strokeW + 2}px 0 ${shadow}`,
    fontStyle: "italic",
  };
}

// ---- Chat feed message states ---------------------------------------------
export type ChatKind = "chat" | "wrong" | "right" | "sys";

export const chatStyle: Record<ChatKind, { bg: string; fg: string; edge: string }> = {
  chat: { bg: color.white, fg: color.royal, edge: color.sky },
  wrong: { bg: color.white, fg: color.ink, edge: color.inkSoft },
  right: { bg: color.orange, fg: color.white, edge: "#a8560a" },
  sys: { bg: color.gold, fg: color.ink, edge: "#a9721a" },
};
