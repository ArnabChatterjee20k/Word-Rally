import { bevel, color, edge } from "../theme.ts";
import { MATCH, PLAYERS, type Screen } from "../data.ts";
import { Panel } from "../components/Panel.tsx";
import { Button } from "../components/Button.tsx";

const SETTINGS: [string, string][] = [
  ["Rounds", `${MATCH.totalRounds} rounds`],
  ["Turn timer", "80 seconds"],
  ["Rotation", "Clockwise"],
  ["Word source", "Picker choice"],
];

export function LobbyScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 16,
        padding: "16px 0",
        alignItems: "start",
      }}
    >
      <Panel
        title={`☰  PLAYERS IN ROOM — ${PLAYERS.length} / ${MATCH.maxPlayers}`}
        bodyStyle={{
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
          gap: 8,
        }}
      >
        {PLAYERS.map((p, i) => {
          const ready = i < 6;
          return (
            <div
              key={p.name}
              style={{
                background: color.white,
                border: `1px solid ${color.royal}`,
                borderRadius: 4,
                padding: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9999,
                  background: p.color,
                  border: `2px solid ${color.ink}`,
                  flex: "0 0 auto",
                }}
              />
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontFamily: "Silkscreen, monospace", fontSize: 9, color: color.royal }}>
                  {i === 0 ? "HOST" : `LEVEL ${3 + i}`}
                </div>
              </div>
              <div
                style={{
                  background: ready ? color.orange : color.panel,
                  color: ready ? color.white : color.inkSoft,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".5px",
                  padding: "3px 5px",
                  borderRadius: 2,
                }}
              >
                {ready ? "READY" : "WAIT"}
              </div>
            </div>
          );
        })}
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            background: color.grid,
            ...bevel(edge.blue),
            borderRadius: 6,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", marginBottom: 8 }}>
            MATCH SETTINGS
          </div>
          {SETTINGS.map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 12,
                padding: "4px 0",
                borderBottom: `1px dotted ${color.inkSoft}`,
              }}
            >
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>

        <div style={{ background: color.white, border: `2px solid ${color.royal}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ background: color.gold, padding: "5px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>
            WHAT IS — ROUND ROBIN
          </div>
          <div style={{ padding: 10, fontSize: 12, lineHeight: 1.4 }}>
            Each turn the picker chooses a word, the next player in the ring draws it, and
            the player after that guesses. Every seat shifts one place each turn, so no one
            repeats a role until everyone has had it.
          </div>
        </div>

        <Button onClick={() => go("pick")} style={{ padding: 14, minHeight: 48 }}>
          START MATCH ▶
        </Button>
      </div>
    </div>
  );
}
