import { useState } from "react";
import { bevel, color, displayTitle, edge, font } from "../theme.ts";
import { call } from "../lib/game.ts";
import type { Room } from "../lib/types.ts";
import type { Standing } from "../App.tsx";
import { Button } from "../components/Button.tsx";
import { useToast } from "../components/Toast.tsx";

export function ScoreScreen({
  room,
  standings,
  nameOf,
  me,
}: {
  room: Room;
  standings: Standing[];
  nameOf: (uid: string) => string;
  me: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const top = standings[0]?.score || 1;
  const lastRound = room.round >= room.settings.totalRounds;

  const next = async () => {
    setBusy(true);
    try {
      await call("nextTurn", { roomId: room.id });
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
            ROUND {Math.max(1, room.round)} · TURN COMPLETE — THE WORD WAS
          </div>
          <div style={displayTitle(46, color.royal)}>{room.revealWord || "—"}</div>
        </div>
        <div style={{ background: color.white, border: `2px solid ${color.ink}`, borderRadius: 4, padding: "12px 16px", fontSize: 12, lineHeight: 1.6 }}>
          <div><strong>{nameOf(room.pickerId)}</strong> picked · <strong>{nameOf(room.drawerId)}</strong> drew</div>
          <div><strong>{nameOf(room.guesserId)}</strong> was guessing</div>
          <div style={{ marginTop: 4, color: color.royal, fontFamily: font.pixel, fontSize: 10 }}>
            {room.tier} · {room.points} PTS ON THE LINE
          </div>
        </div>
      </div>

      <div style={{ background: color.panel, ...bevel(edge.panel), borderRadius: 6, margin: "16px 0", overflow: "hidden" }}>
        <div style={{ background: color.base, borderBottom: `2px solid ${color.royal}`, padding: "8px 10px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>
          ☰  STANDINGS
        </div>
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {standings.map((p, i) => (
            <div key={p.userId} style={{ display: "flex", alignItems: "center", gap: 10, background: color.white, border: `1px solid ${color.royal}`, borderRadius: 4, padding: "7px 9px" }}>
              <div style={{ fontFamily: font.pixel, fontSize: 11, width: 22, color: color.royal }}>#{i + 1}</div>
              <div style={{ width: 20, height: 20, borderRadius: 9999, background: p.color, border: `2px solid ${color.ink}` }} />
              <div style={{ width: 120, fontSize: 12, fontWeight: 700 }}>
                {p.name}
                {p.userId === me ? " (you)" : ""}
              </div>
              <div style={{ flex: "1 1 auto", height: 12, background: color.panel, border: `1px solid #5a5f8c`, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((p.score / top) * 100)}%`, background: color.orange }} />
              </div>
              <div style={{ fontFamily: font.pixel, fontSize: 11, width: 42, textAlign: "right" }}>{p.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button onClick={next} style={{ padding: "14px 20px", opacity: busy ? 0.6 : 1 }}>
          {lastRound ? "FINAL RESULTS ▶" : "NEXT TURN ▶"}
        </Button>
      </div>
    </>
  );
}
