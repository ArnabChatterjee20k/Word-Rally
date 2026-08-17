import { bevel, color, displayTitle, dots, edge, font } from "../theme.ts";
import { MATCH, sortedPlayers, type Screen } from "../data.ts";
import { Button } from "../components/Button.tsx";

const AWARDS = [
  { title: "FASTEST GUESS", who: "NoodleFox", note: "4.2s on KITE" },
  { title: "BEST DRAWING", who: "ArcadeKid", note: "voted by 6 players" },
  { title: "CRUELEST WORD", who: "Zed", note: "picked STAGE FRIGHT" },
];

export function WinnerScreen({ go }: { go: (s: Screen) => void }) {
  const s = sortedPlayers();
  const podium = [
    { pos: "2ND", p: s[1]!, h: 150 },
    { pos: "1ST", p: s[0]!, h: 190 },
    { pos: "3RD", p: s[2]!, h: 130 },
  ];

  return (
    <>
      <div
        style={{
          background: color.crimson,
          ...dots("rgba(0,0,0,.25)", 5),
          ...bevel(edge.crimson),
          padding: "26px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: font.pixel, fontSize: 10, color: "#ffd9a0", marginBottom: 10 }}>
          MATCH COMPLETE — {MATCH.totalRounds} ROUNDS
        </div>
        <div style={displayTitle(56, "#58090b")}>{MATCH.championName} WINS</div>
        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: color.white }}>
          {MATCH.championScore} points · guessed {MATCH.championGuesses} words · never missed a turn
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, alignItems: "end", padding: "20px 0" }}>
        {podium.map((x) => (
          <div
            key={x.pos}
            style={{
              background: color.grid,
              ...bevel(edge.blue),
              borderRadius: 4,
              padding: 12,
              textAlign: "center",
              height: x.h,
            }}
          >
            <div style={{ width: 44, height: 44, margin: "0 auto 8px auto", borderRadius: 9999, background: x.p.color, border: `3px solid ${color.ink}` }} />
            <div style={{ fontFamily: font.display, fontSize: 20, color: color.white, WebkitTextStroke: `2px ${color.ink}` }}>
              {x.pos}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{x.p.name}</div>
            <div style={{ fontFamily: font.pixel, fontSize: 12, color: color.ink, marginTop: 4 }}>{x.p.score}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        {AWARDS.map((a) => (
          <div key={a.title} style={{ background: color.white, border: `2px solid ${color.royal}`, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ background: color.gold, padding: "5px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>
              {a.title}
            </div>
            <div style={{ padding: 10, fontSize: 12, lineHeight: 1.4 }}>
              <strong>{a.who}</strong> — {a.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 16 }}>
        <Button onClick={() => go("lobby")} style={{ padding: "14px 20px" }}>
          REMATCH ▶
        </Button>
        <Button variant="dark" onClick={() => go("landing")} style={{ padding: "14px 20px" }}>
          LEAVE ROOM
        </Button>
      </div>
    </>
  );
}
