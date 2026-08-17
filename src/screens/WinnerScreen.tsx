import { useState } from "react";
import { bevel, color, displayTitle, dots, edge, font } from "../theme.ts";
import { call } from "../lib/game.ts";
import type { Room } from "../lib/types.ts";
import type { Standing } from "../App.tsx";
import { Button } from "../components/Button.tsx";
import { useToast } from "../components/Toast.tsx";

export function WinnerScreen({
  room,
  standings,
  me,
  onLeave,
}: {
  room: Room;
  standings: Standing[];
  me: string;
  onLeave: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const isHost = me === room.hostId;
  const champ = standings[0];

  const podium = [
    { pos: "2ND", p: standings[1], h: 150 },
    { pos: "1ST", p: standings[0], h: 190 },
    { pos: "3RD", p: standings[2], h: 130 },
  ].filter((x) => x.p);

  const rematch = async () => {
    setBusy(true);
    try {
      await call("rematch", { roomId: room.id });
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
          background: color.crimson,
          ...dots("rgba(0,0,0,.25)", 5),
          ...bevel(edge.crimson),
          padding: "26px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: font.pixel, fontSize: 10, color: "#ffd9a0", marginBottom: 10 }}>
          MATCH COMPLETE — {room.settings.totalRounds} ROUNDS
        </div>
        <div style={displayTitle(56, "#58090b")}>{(champ?.name || "NOBODY").toUpperCase()} WINS</div>
        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: color.white }}>
          {champ?.score ?? 0} points
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${podium.length},1fr)`, gap: 12, alignItems: "end", padding: "20px 0" }}>
        {podium.map((x) => (
          <div key={x.pos} style={{ background: color.grid, ...bevel(edge.blue), borderRadius: 4, padding: 12, textAlign: "center", height: x.h }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 8px auto", borderRadius: 9999, background: x.p!.color, border: `3px solid ${color.ink}` }} />
            <div style={{ fontFamily: font.display, fontSize: 20, color: color.white, WebkitTextStroke: `2px ${color.ink}` }}>{x.pos}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{x.p!.name}</div>
            <div style={{ fontFamily: font.pixel, fontSize: 12, color: color.ink, marginTop: 4 }}>{x.p!.score}</div>
          </div>
        ))}
      </div>

      <div style={{ background: color.panel, ...bevel(edge.panel), borderRadius: 6, overflow: "hidden" }}>
        <div style={{ background: color.base, borderBottom: `2px solid ${color.royal}`, padding: "8px 10px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>
          ☰  FINAL STANDINGS
        </div>
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {standings.map((p, i) => (
            <div key={p.userId} style={{ display: "flex", alignItems: "center", gap: 10, background: color.white, border: `1px solid ${color.royal}`, borderRadius: 4, padding: "6px 9px" }}>
              <div style={{ fontFamily: font.pixel, fontSize: 11, width: 22, color: color.royal }}>#{i + 1}</div>
              <div style={{ width: 18, height: 18, borderRadius: 9999, background: p.color, border: `2px solid ${color.ink}` }} />
              <div style={{ flex: "1 1 auto", fontSize: 12, fontWeight: 700 }}>
                {p.name}
                {p.userId === me ? " (you)" : ""}
              </div>
              <div style={{ fontFamily: font.pixel, fontSize: 11 }}>{p.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 16 }}>
        {isHost && (
          <Button onClick={rematch} style={{ padding: "14px 20px", opacity: busy ? 0.6 : 1 }}>
            REMATCH ▶
          </Button>
        )}
        <Button variant="dark" onClick={onLeave} style={{ padding: "14px 20px" }}>
          LEAVE ROOM
        </Button>
      </div>
    </>
  );
}
