import { bevel, color, dots, edge, font } from "../theme.ts";
import { MATCH, PLAYERS, SCREENS, type Screen } from "../data.ts";
import { useToast } from "./Toast.tsx";

export function Header() {
  const toast = useToast();
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(MATCH.roomCode).catch(() => {});
    toast(`Room code ${MATCH.roomCode} copied`);
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
          {MATCH.roomCode}
        </div>
        <button
          onClick={copy}
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
            cursor: "pointer",
            minHeight: 28,
          }}
        >
          COPY
        </button>
      </div>
    </div>
  );
}

export function Tabs({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
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
      {SCREENS.map(([k, label]) => {
        const active = screen === k;
        return (
          <button
            key={k}
            onClick={() => go(k)}
            style={{
              background: active ? color.royal : "transparent",
              color: active ? color.white : "#e48600",
              border: 0,
              borderBottom: `3px solid ${active ? color.orange : "transparent"}`,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".5px",
              textTransform: "uppercase",
              padding: "8px 10px",
              cursor: "pointer",
              minHeight: 34,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusBar() {
  const div = <span style={{ color: color.inkSoft }}>|</span>;
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
        ROUND {MATCH.round} / {MATCH.totalRounds}
      </span>
      {div}
      <span>DRAWER: {MATCH.drawerName}</span>
      {div}
      <span>GUESSER: {MATCH.guesserName}</span>
      {div}
      <span>{PLAYERS.length} PLAYERS</span>
      <span style={{ marginLeft: "auto", color: color.royal }}>
        TURN ORDER ROTATES CLOCKWISE
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
        Word Rally — concept prototype. Round-robin picker / drawer / guesser rotation.
      </div>
      <a href="#" style={{ marginLeft: "auto", fontSize: 10, color: color.sky }}>
        Privacy Policy
      </a>
    </div>
  );
}
