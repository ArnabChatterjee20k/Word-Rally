import { useState } from "react";
import { bevel, color, displayTitle, edge, font } from "../theme.ts";
import { pickColor } from "../data.ts";
import { call } from "../lib/game.ts";
import { Panel } from "../components/Panel.tsx";
import { Button } from "../components/Button.tsx";
import { useToast } from "../components/Toast.tsx";

const label = { fontSize: 12, fontWeight: 700, color: color.ink } as const;
const input = {
  background: color.white,
  border: `1px solid #5a5f8c`,
  borderRadius: 2,
  padding: 8,
  fontSize: 12,
  minHeight: 34,
} as const;

export function LandingScreen({ me, onEnter }: { me: string; onEnter: (roomId: string) => void }) {
  const toast = useToast();
  const [nickname, setNickname] = useState(() => {
    try {
      return localStorage.getItem("wr_nick") || "";
    } catch {
      return "";
    }
  });
  const [joinCode, setJoinCode] = useState("");
  const [rounds, setRounds] = useState(5);
  const [turnSeconds, setTurnSeconds] = useState(80);
  const [busy, setBusy] = useState(false);

  const remember = () => {
    try {
      localStorage.setItem("wr_nick", nickname);
    } catch {
      /* noop */
    }
  };

  const host = async () => {
    setBusy(true);
    try {
      const r = await call<{ roomId: string }>("createRoom", {
        nickname: nickname || "Host",
        color: pickColor(me),
        settings: { totalRounds: rounds, turnSeconds },
        maxPlayers: 16,
      });
      remember();
      onEnter(r.roomId);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (!joinCode.trim()) return toast("Enter a room code");
    setBusy(true);
    try {
      const r = await call<{ roomId: string }>("joinRoom", {
        code: joinCode.trim().toUpperCase(),
        nickname: nickname || "Player",
        color: pickColor(me),
      });
      remember();
      onEnter(r.roomId);
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
          background: color.lavender,
          ...bevel(edge.lavender),
          padding: "28px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div style={displayTitle(52, color.royal)}>WORD RALLY</div>
          <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: color.ink }}>
            One player picks a word. One player draws it. One player guesses. Everybody
            rotates. Highest score after the last round takes the cartridge.
          </div>
        </div>
        <div
          style={{
            width: 110,
            height: 110,
            background: color.white,
            border: `3px solid ${color.ink}`,
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: font.pixel,
            fontSize: 10,
            textAlign: "center",
            color: color.royal,
            padding: 10,
          }}
        >
          MASCOT ART GOES HERE
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16,
          padding: "16px 0",
        }}
      >
        <Panel title="☰  JOIN A ROOM" bodyStyle={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={label}>Nickname</label>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="ARCADEKID" maxLength={32} style={input} />
          <label style={label}>Room code</label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="4-letter code"
            maxLength={4}
            style={{ ...input, letterSpacing: "2px" }}
          />
          <Button onClick={join} style={{ marginTop: 4, opacity: busy ? 0.6 : 1 }}>
            JOIN GAME ▶
          </Button>
        </Panel>

        <Panel title="☰  HOST A ROOM" bodyStyle={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={label}>Rounds</label>
          <select
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            style={{ ...input, border: `1px solid ${color.ink}`, padding: 6 }}
          >
            <option value={3}>3 rounds</option>
            <option value={5}>5 rounds</option>
            <option value={8}>8 rounds</option>
          </select>
          <label style={label}>Seconds per turn</label>
          <select
            value={turnSeconds}
            onChange={(e) => setTurnSeconds(Number(e.target.value))}
            style={{ ...input, border: `1px solid ${color.ink}`, padding: 6 }}
          >
            <option value={60}>60</option>
            <option value={80}>80</option>
            <option value={120}>120</option>
          </select>
          <div style={{ borderTop: `1px dotted ${color.inkSoft}`, margin: "4px 0" }} />
          <div style={{ fontSize: 12, lineHeight: 1.4, color: color.ink }}>
            Max 16 players. Everyone gets an equal number of turns as picker, drawer and
            guesser. You need at least 3 players to start.
          </div>
          <Button variant="dark" onClick={host} style={{ opacity: busy ? 0.6 : 1 }}>
            CREATE ROOM
          </Button>
        </Panel>
      </div>
    </>
  );
}
