import { useState } from "react";
import { bevel, color, dots, edge, font } from "../theme.ts";
import { PHASES } from "../data.ts";
import type { Room, Status } from "../lib/types.ts";
import { isMuted, primeAudio, sfx, toggleMuted } from "../lib/sound.ts";
import { useToast } from "./Toast.tsx";

export function Header({ room }: { room: Room | null }) {
  const toast = useToast();
  const [muted, setMuted] = useState(isMuted());
  const onToggleMute = () => {
    const m = toggleMuted();
    setMuted(m);
    if (!m) {
      primeAudio();
      sfx.click();
    }
  };
  const code = room?.code ?? "----";
  const copy = () => {
    if (room && navigator.clipboard) navigator.clipboard.writeText(room.code).catch(() => {});
    if (room) toast(`Room code ${room.code} copied`);
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        padding: "0 4px 8px 4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: color.gold,
            ...bevel(edge.gold),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: font.display,
            fontSize: 22,
            color: color.ink,
          }}
        >
          W
        </div>
        <div
          style={{
            background: color.white,
            border: `2px solid ${color.ink}`,
            borderRadius: 10,
            padding: "8px 12px",
            fontFamily: font.pixel,
            fontSize: 10,
            lineHeight: 1.3,
            color: color.ink,
          }}
        >
          WELCOME TO WORD RALLY! PICK IT, DRAW IT, GUESS IT.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
        <button
          onClick={onToggleMute}
          title={muted ? "Sound off — click to enable" : "Sound on — click to mute"}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{
            background: muted ? color.panel : color.gold,
            color: color.ink,
            border: 0,
            ...bevel(edge.gold),
            borderRadius: 2,
            padding: "4px 8px",
            fontSize: 13,
            lineHeight: 1,
            cursor: "pointer",
            minHeight: 28,
            marginRight: 4,
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".5px", color: color.ink }}>
          ROOM CODE
        </div>
        <div
          style={{
            background: color.white,
            ...bevel(edge.code),
            padding: "3px 10px",
            fontFamily: font.pixel,
            fontSize: 13,
            letterSpacing: "2px",
            color: color.red,
          }}
        >
          {code}
        </div>
        <button
          onClick={copy}
          disabled={!room}
          style={{
            background: color.gold,
            color: color.ink,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".5px",
            border: 0,
            ...bevel(edge.gold),
            borderRadius: 2,
            padding: "5px 10px",
            cursor: room ? "pointer" : "default",
            opacity: room ? 1 : 0.5,
            minHeight: 28,
          }}
        >
          COPY
        </button>
      </div>
    </div>
  );
}

/** Read-only phase indicator — replaces the free tab bar (screen = room.status). */
export function PhaseBar({ status }: { status: Status }) {
  return (
    <div
      style={{
        background: color.ink,
        ...dots("rgba(255,255,255,.10)", 3),
        display: "flex",
        alignItems: "stretch",
        flexWrap: "wrap",
        gap: 2,
        padding: "4px 8px",
        borderTop: "2px solid #4b5170",
        borderBottom: "2px solid #05060a",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginRight: 10 }}>
        <div
          style={{
            background: color.white,
            borderRadius: 9999,
            padding: "3px 14px",
            fontFamily: font.display,
            fontSize: 13,
            letterSpacing: ".5px",
            color: color.red,
          }}
        >
          WORD RALLY
        </div>
      </div>
      {PHASES.map(([k, label]) => {
        const active = status === k;
        return (
          <div
            key={k}
            style={{
              background: active ? color.royal : "transparent",
              color: active ? color.white : "#6a6f92",
              borderBottom: `3px solid ${active ? color.orange : "transparent"}`,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".5px",
              textTransform: "uppercase",
              padding: "8px 10px",
              minHeight: 34,
              display: "flex",
              alignItems: "center",
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

export function StatusBar({
  room,
  nameOf,
  onlineCount,
  onLeave,
  onEndMatch,
}: {
  room: Room;
  nameOf: (uid: string) => string;
  onlineCount: number;
  onLeave: () => void;
  onEndMatch?: () => void;
}) {
  const div = <span style={{ color: color.inkSoft }}>|</span>;
  const ctrlBtn = (bg: string): React.CSSProperties => ({
    background: bg,
    color: color.white,
    border: 0,
    borderRadius: 2,
    padding: "4px 9px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: ".5px",
    cursor: "pointer",
    minHeight: 26,
  });
  return (
    <div
      style={{
        background: color.sky,
        borderBottom: `2px solid ${color.royal}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".5px",
        color: color.ink,
      }}
    >
      <span>
        ROUND {Math.max(1, room.round)} / {room.settings.totalRounds}
      </span>
      {div}
      <span>DRAWER: {nameOf(room.drawerId) || "—"}</span>
      {div}
      <span>GUESSER: {nameOf(room.guesserId) || "—"}</span>
      {div}
      <span>
        {room.turnOrder.length} PLAYERS{onlineCount ? ` · ${onlineCount} ONLINE` : ""}
      </span>
      <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
        {onEndMatch && (
          <button onClick={onEndMatch} style={ctrlBtn(color.red)} title="End the match now (host)">
            END MATCH
          </button>
        )}
        <button onClick={onLeave} style={ctrlBtn(color.ink)} title="Leave this room">
          LEAVE ✕
        </button>
      </span>
    </div>
  );
}

export function Footer() {
  return (
    <div
      style={{
        background: color.ink,
        ...dots("rgba(255,255,255,.08)", 3),
        padding: 16,
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          background: color.gold,
          color: color.ink,
          fontSize: 10,
          fontWeight: 700,
          padding: "3px 6px",
          borderRadius: 2,
        }}
      >
        ESRB — PRIVACY CERTIFIED
      </div>
      <div style={{ fontSize: 10, color: color.sky, lineHeight: 1.3 }}>
        Word Rally — realtime party game on Appwrite. Round-robin picker / drawer / guesser.
      </div>
      <a href="#" style={{ marginLeft: "auto", fontSize: 10, color: color.sky }}>
        Privacy Policy
      </a>
    </div>
  );
}

export function Splash({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        fontFamily: font.pixel,
        fontSize: 12,
        color: color.ink,
      }}
    >
      {text}
    </div>
  );
}
