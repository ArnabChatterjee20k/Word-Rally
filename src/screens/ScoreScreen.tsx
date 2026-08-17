import { bevel, color, displayTitle, edge, font } from "../theme.ts";
import { MATCH, sortedPlayers, type Screen } from "../data.ts";
import { Button } from "../components/Button.tsx";

export function ScoreScreen({ go }: { go: (s: Screen) => void }) {
  const players = sortedPlayers();
  const top = players[0]!.score;

  return (
    <>
      <div
        style={{
          background: "#c0d5e6",
          ...bevel(edge.sky),
          padding: "22px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontFamily: font.pixel, fontSize: 10, color: color.royal, marginBottom: 8 }}>
            ROUND {MATCH.round} COMPLETE — THE WORD WAS
          </div>
          <div style={displayTitle(46, color.royal)}>{MATCH.revealWord}</div>
        </div>
        <div
          style={{
            background: color.white,
            border: `2px solid ${color.ink}`,
            borderRadius: 4,
            padding: "12px 16px",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <div>
            <strong>{MATCH.guesserName}</strong> guessed it in 34s{" "}
            <span style={{ color: color.red, fontWeight: 700 }}>+120</span>
          </div>
          <div>
            <strong>{MATCH.drawerName}</strong> drew it{" "}
            <span style={{ color: color.red, fontWeight: 700 }}>+60</span>
          </div>
          <div>
            <strong>{MATCH.pickerName}</strong> picked it{" "}
            <span style={{ color: color.red, fontWeight: 700 }}>+20</span>
          </div>
        </div>
      </div>

      <div style={{ background: color.panel, ...bevel(edge.panel), borderRadius: 6, margin: "16px 0", overflow: "hidden" }}>
        <div
          style={{
            background: color.base,
            borderBottom: `2px solid ${color.royal}`,
            padding: "8px 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".5px",
          }}
        >
          ☰  STANDINGS AFTER ROUND {MATCH.round}
        </div>
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {players.map((p, i) => (
            <div
              key={p.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: color.white,
                border: `1px solid ${color.royal}`,
                borderRadius: 4,
                padding: "7px 9px",
              }}
            >
              <div style={{ fontFamily: font.pixel, fontSize: 11, width: 22, color: color.royal }}>
                #{i + 1}
              </div>
              <div style={{ width: 20, height: 20, borderRadius: 9999, background: p.color, border: `2px solid ${color.ink}` }} />
              <div style={{ width: 120, fontSize: 12, fontWeight: 700 }}>{p.name}</div>
              <div style={{ flex: "1 1 auto", height: 12, background: color.panel, border: `1px solid #5a5f8c`, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((p.score / top) * 100)}%`, background: color.orange }} />
              </div>
              <div style={{ fontFamily: font.pixel, fontSize: 11, width: 42, textAlign: "right" }}>{p.score}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: color.red, width: 44, textAlign: "right" }}>
                {i < 3 ? `+${200 - i * 60}` : "+0"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button onClick={() => go("pick")} style={{ padding: "14px 20px" }}>
          NEXT ROUND ▶
        </Button>
        <Button variant="dark" onClick={() => go("winner")} style={{ padding: "14px 20px" }}>
          SKIP TO FINAL RESULTS
        </Button>
      </div>
    </>
  );
}
