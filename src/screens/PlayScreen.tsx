import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { bevel, chatStyle, color, edge, font } from "../theme.ts";
import {
  BRUSHES,
  MATCH,
  SWATCHES,
  sortedPlayers,
  type ChatMsg,
  type Screen,
} from "../data.ts";
import type { Role } from "../App.tsx";
import { Button } from "../components/Button.tsx";

type Props = {
  go: (s: Screen) => void;
  role: Role;
  setRole: (r: Role) => void;
  brushColor: string;
  setBrushColor: (c: string) => void;
  brush: number;
  setBrush: (n: number) => void;
  erasing: boolean;
  setErasing: (b: boolean) => void;
  secs: number;
  guess: string;
  setGuess: (v: string) => void;
  chat: ChatMsg[];
  sendGuess: () => void;
};

function clockStr(secs: number) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function PlayScreen(p: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Fill the board white once on mount.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, el.width, el.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Keep the feed scrolled to newest.
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [p.chat]);

  const toCanvasPoint = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const el = canvasRef.current!;
    const r = el.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (el.width / r.width),
      y: (e.clientY - r.top) * (el.height / r.height),
    };
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (p.role !== "drawer") return;
    const el = canvasRef.current!;
    const ctx = el.getContext("2d")!;
    drawing.current = true;
    el.setPointerCapture(e.pointerId);
    const { x, y } = toCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = toCanvasPoint(e);
    ctx.strokeStyle = p.erasing ? "#ffffff" : p.brushColor;
    ctx.lineWidth = p.erasing ? p.brush * 3 : p.brush;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
  };

  const clear = () => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, el.width, el.height);
  };

  const scores = sortedPlayers().slice(0, 6);
  const isDrawer = p.role === "drawer";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 0", alignItems: "stretch" }}>
      {/* Scoreboard */}
      <div
        style={{
          flex: "1 1 160px",
          maxWidth: "100%",
          background: color.grid,
          ...bevel(edge.blue),
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div style={{ background: color.base, borderBottom: `2px solid ${color.royal}`, padding: "6px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>
          SCOREBOARD
        </div>
        {scores.map((pl, i) => (
          <div
            key={pl.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 8px",
              background: i % 2 ? color.grid : color.sky,
              borderBottom: `1px solid ${color.base}`,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 9999, background: pl.color, border: `1px solid ${color.ink}`, flex: "0 0 auto" }} />
            <div style={{ flex: "1 1 auto", minWidth: 0, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pl.name}
            </div>
            <div style={{ fontFamily: font.pixel, fontSize: 10, color: color.ink }}>{pl.score}</div>
          </div>
        ))}
        <div style={{ padding: 8, fontSize: 10, lineHeight: 1.3, color: color.ink, background: color.sky }}>
          Roles rotate one seat each turn.
        </div>
      </div>

      {/* Board + tools */}
      <div
        style={{
          flex: "100 1 420px",
          minWidth: 0,
          background: color.base,
          ...bevel(edge.blue),
          borderRadius: 6,
          padding: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: color.ink, color: color.white, fontFamily: font.pixel, fontSize: 14, padding: "5px 10px", borderRadius: 2 }}>
              {clockStr(p.secs)}
            </div>
            <div style={{ fontFamily: font.display, fontSize: 22, letterSpacing: "6px", color: color.white, WebkitTextStroke: `2px ${color.ink}` }}>
              {MATCH.maskedWord}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["drawer", "guesser"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => p.setRole(r)}
                style={{
                  background: p.role === r ? color.orange : color.ink,
                  color: color.white,
                  border: 0,
                  borderRadius: 2,
                  padding: "7px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".5px",
                  cursor: "pointer",
                  minHeight: 32,
                }}
              >
                {r === "drawer" ? "DRAWER VIEW" : "GUESSER VIEW"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", background: color.white, border: `2px solid ${color.royal}`, borderRadius: 4, overflow: "hidden" }}>
          <canvas
            ref={canvasRef}
            width={760}
            height={430}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={stop}
            onPointerLeave={stop}
            style={{ display: "block", width: "100%", height: "auto", touchAction: "none", cursor: isDrawer ? "crosshair" : "default" }}
          />
          {!isDrawer && (
            <div style={{ position: "absolute", left: 8, top: 8, background: "rgba(33,36,46,.85)", color: color.white, fontFamily: font.pixel, fontSize: 9, padding: "4px 7px", borderRadius: 2 }}>
              WATCHING {MATCH.drawerName} DRAW
            </div>
          )}
        </div>

        {isDrawer && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {SWATCHES.map((hex) => (
              <button
                key={hex}
                onClick={() => {
                  p.setBrushColor(hex);
                  p.setErasing(false);
                }}
                style={{
                  width: 26,
                  height: 26,
                  background: hex,
                  border: `2px solid ${!p.erasing && p.brushColor === hex ? color.orange : color.royal}`,
                  borderRadius: 2,
                  cursor: "pointer",
                }}
              />
            ))}
            <div style={{ width: 2, height: 24, background: color.royal, margin: "0 4px" }} />
            {BRUSHES.map(([label, w]) => (
              <button
                key={label}
                onClick={() => p.setBrush(w)}
                style={{
                  background: p.brush === w ? color.gold : color.white,
                  color: color.ink,
                  border: 0,
                  borderRadius: 2,
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 30,
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => p.setErasing(!p.erasing)}
              style={{
                background: p.erasing ? color.orange : color.white,
                color: p.erasing ? color.white : color.ink,
                border: `2px solid ${color.royal}`,
                borderRadius: 2,
                padding: "5px 10px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".5px",
                cursor: "pointer",
                minHeight: 30,
              }}
            >
              ERASER
            </button>
            <Button variant="dark" size="sm" onClick={clear} style={{ marginLeft: "auto", padding: "8px 12px", fontSize: 10 }}>
              CLEAR
            </Button>
            <Button size="sm" onClick={() => p.go("score")} style={{ padding: "8px 14px", fontSize: 10 }}>
              END TURN ▶
            </Button>
          </div>
        )}
      </div>

      {/* Guess feed */}
      <div
        style={{
          flex: "1 1 240px",
          minWidth: 0,
          background: color.panel,
          ...bevel(edge.panel),
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ background: color.base, borderBottom: `2px solid ${color.royal}`, padding: "6px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>
          GUESS FEED
        </div>
        <div ref={feedRef} style={{ flex: "1 1 auto", padding: 8, display: "flex", flexDirection: "column", gap: 5, maxHeight: 380, overflowY: "auto" }}>
          {p.chat.map((m, i) => {
            const st = chatStyle[m.kind];
            return (
              <div
                key={i}
                style={{
                  background: st.bg,
                  borderLeft: `3px solid ${st.edge}`,
                  borderRadius: 2,
                  padding: "5px 7px",
                  fontSize: 11,
                  lineHeight: 1.35,
                  color: st.fg,
                }}
              >
                <strong>{m.who}</strong> {m.text}
              </div>
            );
          })}
        </div>
        <div style={{ padding: 8, borderTop: `2px solid ${color.base}`, display: "flex", gap: 5 }}>
          <input
            value={p.guess}
            onChange={(e) => p.setGuess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") p.sendGuess();
            }}
            placeholder="Type your guess"
            style={{ flex: "1 1 auto", minWidth: 0, background: color.white, border: `1px solid #5a5f8c`, borderRadius: 2, padding: 8, fontSize: 12, minHeight: 36 }}
          />
          <button
            onClick={p.sendGuess}
            style={{ background: color.orange, color: color.white, border: 0, borderRadius: 9999, width: 36, height: 36, fontSize: 14, cursor: "pointer" }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
