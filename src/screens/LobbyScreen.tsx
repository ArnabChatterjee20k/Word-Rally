import { useState } from "react";
import { bevel, color, edge, font } from "../theme.ts";
import { CONFIG } from "../config.ts";
import { tablesDB } from "../lib/appwrite.ts";
import { call } from "../lib/game.ts";
import type { Player, Room } from "../lib/types.ts";
import type { Online } from "../lib/presence.ts";
import { Panel } from "../components/Panel.tsx";
import { Button } from "../components/Button.tsx";
import { LinkIcon } from "../components/Icons.tsx";
import { useToast } from "../components/Toast.tsx";

export function LobbyScreen({
  room,
  players,
  me,
  online,
  onLeave,
}: {
  room: Room;
  players: Player[];
  me: string;
  online: Online;
  onLeave: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const isHost = me === room.hostId;
  const myRow = players.find((p) => p.userId === me);
  const knownOnline = Object.keys(online).length;

  const settings: [string, string][] = [
    ["Rounds", `${room.settings.totalRounds} rounds`],
    ["Turn timer", `${room.settings.turnSeconds} seconds`],
    ["Rotation", "Clockwise"],
    ["Word source", "Picker choice"],
  ];

  const toggleReady = async () => {
    if (!myRow) return;
    try {
      await tablesDB.updateRow({
        databaseId: CONFIG.dbId,
        tableId: CONFIG.tables.players,
        rowId: myRow.id,
        data: { ready: !myRow.ready },
      });
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const copyInvite = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    toast("Invite link copied — share it to join!");
  };

  const start = async () => {
    setBusy(true);
    try {
      await call("startMatch", { roomId: room.id });
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, padding: "16px 0", alignItems: "start" }}>
      <Panel
        title={`☰  PLAYERS IN ROOM — ${players.length} / ${room.maxPlayers}`}
        bodyStyle={{ padding: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 8 }}
      >
        {players.map((p) => {
          const isOnline = knownOnline === 0 || online[p.userId] !== undefined;
          return (
            <div key={p.id} style={{ background: color.white, border: `1px solid ${color.royal}`, borderRadius: 4, padding: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", flex: "0 0 auto" }}>
                <div style={{ width: 26, height: 26, borderRadius: 9999, background: p.color, border: `2px solid ${color.ink}` }} />
                <div
                  title={isOnline ? "online" : "away"}
                  style={{
                    position: "absolute",
                    right: -2,
                    bottom: -2,
                    width: 9,
                    height: 9,
                    borderRadius: 9999,
                    background: isOnline ? "#3fbf5f" : "#9aa0b8",
                    border: `1.5px solid ${color.white}`,
                  }}
                />
              </div>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.nickname}
                  {p.userId === me ? " (you)" : ""}
                </div>
                <div style={{ fontFamily: font.pixel, fontSize: 9, color: color.royal }}>
                  {p.isHost ? "HOST" : "PLAYER"}
                </div>
              </div>
              <div style={{ background: p.ready ? color.orange : color.panel, color: p.ready ? color.white : color.inkSoft, fontSize: 9, fontWeight: 700, letterSpacing: ".5px", padding: "3px 5px", borderRadius: 2 }}>
                {p.ready ? "READY" : "WAIT"}
              </div>
            </div>
          );
        })}
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Button variant="gold" onClick={copyInvite} style={{ padding: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <LinkIcon />
            COPY INVITE LINK
          </span>
        </Button>
        <div style={{ background: color.grid, ...bevel(edge.blue), borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", marginBottom: 8 }}>MATCH SETTINGS</div>
          {settings.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "4px 0", borderBottom: `1px dotted ${color.inkSoft}` }}>
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>

        <div style={{ background: color.white, border: `2px solid ${color.royal}`, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ background: color.gold, padding: "5px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>WHAT IS — ROUND ROBIN</div>
          <div style={{ padding: 10, fontSize: 12, lineHeight: 1.4 }}>
            Each turn the picker chooses a word, the next player draws it, and the one after
            that guesses. Every seat shifts one place each turn.
          </div>
        </div>

        <Button variant={myRow?.ready ? "gold" : "ghost"} onClick={toggleReady}>
          {myRow?.ready ? "✓ READY" : "MARK READY"}
        </Button>

        {isHost ? (
          <Button onClick={start} style={{ padding: 14, minHeight: 48, opacity: busy || players.length < 2 ? 0.6 : 1 }}>
            {players.length < 2 ? "NEED 2+ PLAYERS" : "START MATCH ▶"}
          </Button>
        ) : (
          <div style={{ fontFamily: font.pixel, fontSize: 10, color: color.ink, textAlign: "center", padding: "6px 0" }}>
            Waiting for the host to start…
          </div>
        )}

        <button onClick={onLeave} style={{ background: "transparent", border: 0, color: color.royal, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 6 }}>
          Leave room
        </button>
      </div>
    </div>
  );
}
