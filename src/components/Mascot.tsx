import { color } from "../theme.ts";

/** "Rally" — the Word Rally mascot: a friendly arcade blob doodling with a crayon.
 *  Pure inline SVG in the game's palette, so it ships with the bundle. */
export function Mascot({ size = 92 }: { size?: number }) {
  const ink = color.ink;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Word Rally mascot"
      style={{ display: "block" }}
    >
      {/* drop shadow */}
      <ellipse cx="50" cy="86" rx="26" ry="5" fill={ink} opacity="0.18" />

      {/* body: rounded top, wavy bottom */}
      <path
        d="M22,52 C22,33 34,22 50,22 C66,22 78,33 78,52 L78,74
           L71,80 L64,74 L57,80 L50,74 L43,80 L36,74 L29,80 L22,74 Z"
        fill={color.orange}
        stroke={ink}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* belly shine */}
      <path d="M31,40 C31,32 37,28 43,29 C36,33 34,40 37,47 C32,47 31,44 31,40 Z" fill="#ffffff" opacity="0.35" />

      {/* eyes */}
      <circle cx="41" cy="49" r="7" fill="#ffffff" stroke={ink} strokeWidth="3" />
      <circle cx="61" cy="49" r="7" fill="#ffffff" stroke={ink} strokeWidth="3" />
      <circle cx="43" cy="50" r="3" fill={ink} />
      <circle cx="63" cy="50" r="3" fill={ink} />

      {/* cheeks */}
      <circle cx="34" cy="60" r="3.5" fill={color.red} opacity="0.55" />
      <circle cx="68" cy="60" r="3.5" fill={color.red} opacity="0.55" />

      {/* smile */}
      <path d="M45,60 Q51,66 57,60" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />

      {/* little antenna with a red bulb (arcade) */}
      <path d="M50,22 L50,13" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="10" r="4" fill={color.red} stroke={ink} strokeWidth="2" />

      {/* crayon it's drawing with (draw-and-guess theme) */}
      <g transform="rotate(38 70 66)">
        <rect x="59" y="62" width="26" height="9" rx="1.5" fill={color.royal} stroke={ink} strokeWidth="2.5" />
        <path d="M85,62 L91,66.5 L85,71 Z" fill={color.gold} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="56" y="62" width="4" height="9" rx="1" fill={ink} />
      </g>

      {/* a doodle mark under the crayon */}
      <path d="M20,80 q6,-6 12,0" fill="none" stroke={color.royal} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
