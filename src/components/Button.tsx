import type { CSSProperties, ReactNode } from "react";
import { bevel, bevelY, color, edge } from "../theme.ts";

type Variant = "primary" | "gold" | "dark" | "ghost";

const base: CSSProperties = {
  border: 0,
  borderRadius: 2,
  fontWeight: 700,
  letterSpacing: ".5px",
  cursor: "pointer",
};

/** Bevelled arcade button. `primary` = orange CTA, the design's main action. */
export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: "sm" | "md";
  style?: CSSProperties;
}) {
  const skin: Record<Variant, CSSProperties> = {
    primary: { background: color.orange, color: color.white, ...bevel(edge.orange) },
    gold: { background: color.gold, color: color.ink, ...bevel(edge.gold) },
    dark: { background: color.ink, color: color.white, ...bevelY(edge.dark) },
    ghost: {
      background: color.white,
      color: color.ink,
      border: `2px solid ${color.royal}`,
    },
  };
  const pad = size === "sm" ? "8px 14px" : "12px 16px";
  const minH = size === "sm" ? 32 : 44;

  return (
    <button
      onClick={onClick}
      style={{
        ...base,
        ...skin[variant],
        padding: pad,
        minHeight: minH,
        fontSize: 11,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
