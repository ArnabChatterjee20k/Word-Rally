import { bevel, color, displayTitle, edge, font } from "../theme.ts";
import { MATCH, type Screen } from "../data.ts";
import { Panel } from "../components/Panel.tsx";
import { Button } from "../components/Button.tsx";

const label = { fontSize: 12, fontWeight: 700, color: color.ink } as const;
const input = {
  background: color.white,
  border: `1px solid #5a5f8c`,
  borderRadius: 2,
  padding: 8,
  fontSize: 12,
  minHeight: 34,
} as const;

export function LandingScreen({
  go,
  nickname,
  setNickname,
  joinCode,
  setJoinCode,
}: {
  go: (s: Screen) => void;
  nickname: string;
  setNickname: (v: string) => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
}) {
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
        <Panel
          title="☰  JOIN A ROOM"
          bodyStyle={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
        >
          <label style={label}>Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ARCADEKID"
            style={input}
          />
          <label style={label}>Room code</label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="4-letter code"
            style={{ ...input, letterSpacing: "2px" }}
          />
          <Button onClick={() => go("lobby")} style={{ marginTop: 4 }}>
            JOIN GAME ▶
          </Button>
        </Panel>

        <Panel
          title="☰  HOST A ROOM"
          bodyStyle={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
        >
          <label style={label}>Rounds</label>
          <select style={{ ...input, border: `1px solid ${color.ink}`, padding: 6 }} defaultValue="5 rounds">
            <option>3 rounds</option>
            <option>5 rounds</option>
            <option>8 rounds</option>
          </select>
          <label style={label}>Seconds per turn</label>
          <select style={{ ...input, border: `1px solid ${color.ink}`, padding: 6 }} defaultValue="80">
            <option>60</option>
            <option>80</option>
            <option>120</option>
          </select>
          <div style={{ borderTop: `1px dotted ${color.inkSoft}`, margin: "4px 0" }} />
          <div style={{ fontSize: 12, lineHeight: 1.4, color: color.ink }}>
            Max {MATCH.maxPlayers} players. Everyone gets an equal number of turns as
            picker, drawer and guesser.
          </div>
          <Button variant="dark" onClick={() => go("lobby")}>
            CREATE ROOM
          </Button>
        </Panel>
      </div>
    </>
  );
}
