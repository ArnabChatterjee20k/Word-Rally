import type { CSSProperties, ReactNode } from "react";
import { bevel, color, edge } from "../theme.ts";

/** A raised grey panel with a titled header bar — the app's workhorse card. */
export function Panel({
  title,
  children,
  style,
  bodyStyle,
  headerBg = color.base,
}: {
  title?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  headerBg?: string;
}) {
  return (
    <div
      style={{
        background: color.panel,
        ...bevel(edge.panel),
        borderRadius: 6,
        overflow: "hidden",
        ...style,
      }}
    >
      {title != null && (
        <div
          style={{
            background: headerBg,
            borderBottom: `2px solid ${color.royal}`,
            padding: "8px 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".5px",
            color: color.ink,
          }}
        >
          {title}
        </div>
      )}
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}
