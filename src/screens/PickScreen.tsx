import { bevel, color, displayTitle, edge, font } from "../theme.ts";
import { MATCH, WORD_CHOICES, type Screen } from "../data.ts";
import { Button } from "../components/Button.tsx";

export function PickScreen({
  go,
  customWord,
  setCustomWord,
}: {
  go: (s: Screen) => void;
  customWord: string;
  setCustomWord: (v: string) => void;
}) {
  return (
    <>
      <div
        style={{
          background: color.teal,
          ...bevel(edge.teal),
          padding: "22px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontFamily: font.pixel, fontSize: 10, color: color.sky, marginBottom: 8 }}>
            YOUR TURN TO PICK — {MATCH.pickerName}
          </div>
          <div style={displayTitle(40, "#0d2f3a")}>CHOOSE A WORD</div>
        </div>
        <div style={{ fontSize: 12, color: color.white, fontWeight: 700, textAlign: "right", lineHeight: 1.5 }}>
          {MATCH.drawerName} will draw it.
          <br />
          {MATCH.guesserName} will guess it.
          <br />
          Harder words score more.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
          padding: "16px 0",
        }}
      >
        {WORD_CHOICES.map((w) => (
          <button
            key={w.word}
            onClick={() => go("play")}
            style={{
              textAlign: "left",
              cursor: "pointer",
              background: w.bg,
              ...bevel(edge.panel),
              borderRadius: 6,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", color: color.royal }}>
                {w.tier}
              </span>
              <span
                style={{
                  background: color.gold,
                  color: color.ink,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 2,
                }}
              >
                {w.points} PTS
              </span>
            </div>
            <div style={{ fontFamily: font.display, fontSize: 28, color: color.ink, margin: "10px 0 6px 0" }}>
              {w.word}
            </div>
            <div style={{ fontSize: 12, color: color.ink }}>
              {w.letters} letters · {w.hint}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          background: color.panel,
          ...bevel(edge.panel),
          borderRadius: 6,
          padding: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700 }}>Or type your own:</span>
        <input
          value={customWord}
          onChange={(e) => setCustomWord(e.target.value)}
          placeholder="max 12 letters"
          maxLength={12}
          style={{
            flex: "1 1 200px",
            background: color.white,
            border: `1px solid #5a5f8c`,
            borderRadius: 2,
            padding: 8,
            fontSize: 12,
            minHeight: 34,
          }}
        />
        <Button onClick={() => go("play")} style={{ padding: "10px 18px" }}>
          LOCK IT IN ▶
        </Button>
      </div>
    </>
  );
}
