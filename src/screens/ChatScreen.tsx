import { bevel, color, edge, font } from "../theme.ts";
import { Panel } from "../components/Panel.tsx";

const SPEC = [
  { label: "CHAT", who: "Bit_Rot", text: "is it a vehicle?", bg: color.white, fg: color.royal, edge: color.sky },
  { label: "WRONG GUESS", who: "NoodleFox", text: "ROCKET", bg: color.white, fg: color.ink, edge: color.inkSoft },
  { label: "NEAR MISS", who: "SYSTEM", text: "NoodleFox is close!", bg: color.gold, fg: color.ink, edge: "#a9721a" },
  { label: "CORRECT", who: "NoodleFox", text: "ROCKET SHIP", bg: color.orange, fg: color.white, edge: "#a8560a" },
  { label: "BLOCKED", who: "ArcadeKid", text: "message hidden — you are drawing", bg: color.panel, fg: color.inkSoft, edge: color.inkSoft },
  { label: "ROUND EVENT", who: "SYSTEM", text: "Round 3 ends in 10 seconds", bg: color.ink, fg: color.white, edge: color.red },
];

export function ChatScreen() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 16,
        padding: "16px 0",
        alignItems: "start",
      }}
    >
      <Panel
        title="☰  GUESS FEED — MESSAGE STATES"
        bodyStyle={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}
      >
        {SPEC.map((m) => (
          <div key={m.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 120, flex: "0 0 auto", fontFamily: font.pixel, fontSize: 9, color: color.royal, paddingTop: 6 }}>
              {m.label}
            </div>
            <div
              style={{
                flex: "1 1 auto",
                background: m.bg,
                borderLeft: `4px solid ${m.edge}`,
                borderRadius: 2,
                padding: "8px 10px",
                fontSize: 12,
                lineHeight: 1.4,
                color: m.fg,
              }}
            >
              <strong>{m.who}</strong> {m.text}
            </div>
          </div>
        ))}
      </Panel>

      <div style={{ background: color.grid, ...bevel(edge.blue), borderRadius: 6, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", marginBottom: 8 }}>FEED RULES</div>
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
          Only the designated guesser can submit guesses. Everyone else posts chat, which is
          muted grey. An exact match locks the round instantly; a near match (one letter off,
          or a plural) returns a "so close" nudge visible only to the guesser. The drawer's
          messages are blocked while the word is live.
        </div>
        <div style={{ borderTop: `1px dotted ${color.inkSoft}`, margin: "10px 0" }} />
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
          Muting, reporting and word-leak detection live behind the small chevron on each row.
        </div>
      </div>
    </div>
  );
}
