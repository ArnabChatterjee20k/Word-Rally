import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { bevel, chatStyle, color, edge, font } from "../theme.ts";
import { BRUSHES, SWATCHES } from "../data.ts";
import { CONFIG } from "../config.ts";
import { tablesDB, Query } from "../lib/appwrite.ts";
import { call } from "../lib/game.ts";
import { makeCanvasBroadcaster, subscribeCanvas, type Seg } from "../lib/presence.ts";
import type { Message, Room } from "../lib/types.ts";
import type { Role, Standing } from "../App.tsx";
import { Button } from "../components/Button.tsx";
import { useToast } from "../components/Toast.tsx";

const W = 760;
const H = 430;

function fillWhite(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawSeg(ctx: CanvasRenderingContext2D, s: Seg) {
  if (!s.pts?.length) return;
  ctx.strokeStyle = s.e ? "#ffffff" : s.c;
  ctx.lineWidth = s.e ? s.w * 3 : s.w;
  ctx.beginPath();
  s.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
}

function clockStr(secs: number) {
  const m = String(Math.floor(Math.max(0, secs) / 60)).padStart(2, "0");
  const s = String(Math.max(0, secs) % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function PlayScreen({
  room,
  role,
  messages,
  standings,
  myName,
}: {
  room: Room;
  me: string;
  role: Role;
  messages: Message[];
  standings: Standing[];
  myName: string;
}) {
  const toast = useToast();
  const isDrawer = role === "drawer";
  const isGuesser = role === "guesser";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const [brushColor, setBrushColor] = useState("#21242e");
  const [brush, setBrush] = useState(6);
  const [erasing, setErasing] = useState(false);
  const [guess, setGuess] = useState("");
  const [wordToDraw, setWordToDraw] = useState("");

  // The drawer (and only the drawer) can read the secret word to draw it.
  useEffect(() => {
    if (!isDrawer) return;
    let alive = true;
    tablesDB
      .listRows({
        databaseId: CONFIG.dbId,
        tableId: CONFIG.tables.secretWords,
        queries: [
          Query.equal("roomId", room.id),
          Query.equal("turnIndex", room.turnIndex),
          Query.orderDesc("$createdAt"),
          Query.limit(1),
        ],
      })
      .then((r: any) => {
        const row = (r.rows || r.documents || [])[0];
        if (alive && row) setWordToDraw(String(row.word).toUpperCase());
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isDrawer, room.id, room.turnIndex]);

  // ---- timer ---------------------------------------------------------------
  const [secs, setSecs] = useState(room.settings.turnSeconds);
  const endedRef = useRef(false);
  useEffect(() => {
    const tick = () => {
      if (!room.turnEndsAt) return;
      const remaining = Math.round((new Date(room.turnEndsAt).getTime() - Date.now()) / 1000);
      setSecs(remaining);
      if (remaining <= 0 && isDrawer && !endedRef.current) {
        endedRef.current = true;
        call("endTurn", { roomId: room.id }).catch(() => {});
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room.turnEndsAt, room.id, isDrawer]);

  // ---- canvas setup + per-turn clear --------------------------------------
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (ctx) fillWhite(ctx);
  }, [room.turnIndex]);

  // ---- guesser/spectator: apply incoming strokes ---------------------------
  useEffect(() => {
    if (isDrawer) return;
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d")!;
    const unsub = subscribeCanvas(room.id, {
      apply: (segs) => segs.forEach((s) => drawSeg(ctx, s)),
      clear: () => fillWhite(ctx),
    });
    return unsub;
  }, [room.id, isDrawer, room.turnIndex]);

  // ---- drawer: local draw + throttled presence broadcast -------------------
  const broadcaster = useMemo(() => (isDrawer ? makeCanvasBroadcaster(room.id) : null), [room.id, isDrawer]);
  const draw = useRef(false);
  const style = useRef<{ c: string; w: number; e: boolean }>({ c: brushColor, w: brush, e: erasing });
  const last = useRef<[number, number] | null>(null);
  const buf = useRef<[number, number][]>([]);
  const connect = useRef<[number, number] | null>(null);
  style.current = { c: brushColor, w: brush, e: erasing };

  useEffect(() => {
    if (!isDrawer || !broadcaster) return;
    const flush = () => {
      if (!buf.current.length) return;
      const pts = connect.current ? [connect.current, ...buf.current] : [...buf.current];
      broadcaster.send([{ ...style.current, pts }]);
      connect.current = buf.current[buf.current.length - 1]!;
      buf.current = [];
    };
    const id = setInterval(flush, 100);
    return () => {
      clearInterval(id);
    };
  }, [isDrawer, broadcaster]);

  const toPoint = (e: ReactPointerEvent<HTMLCanvasElement>): [number, number] => {
    const el = canvasRef.current!;
    const r = el.getBoundingClientRect();
    return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    draw.current = true;
    canvasRef.current!.setPointerCapture(e.pointerId);
    const p = toPoint(e);
    last.current = p;
    connect.current = null; // new stroke
    buf.current = [p];
    style.current = { c: brushColor, w: brush, e: erasing };
    ctx.strokeStyle = erasing ? "#ffffff" : brushColor;
    ctx.lineWidth = erasing ? brush * 3 : brush;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
  };

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draw.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = toPoint(e);
    ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    last.current = p;
    buf.current.push(p);
  };

  const onUp = () => {
    if (!isDrawer) return;
    draw.current = false;
    // final flush of the stroke
    if (broadcaster && buf.current.length) {
      const pts = connect.current ? [connect.current, ...buf.current] : [...buf.current];
      broadcaster.send([{ ...style.current, pts }]);
    }
    buf.current = [];
    connect.current = null;
  };

  const clearBoard = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) fillWhite(ctx);
    broadcaster?.clear();
  };

  // ---- guess feed autoscroll ----------------------------------------------
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  const sendGuess = async () => {
    const g = guess.trim();
    if (!g) return;
    setGuess("");
    try {
      const r = await call<{ result: string }>("submitGuess", {
        roomId: room.id,
        guess: g,
        nickname: myName,
      });
      if (r.result === "timeout") toast("Time's up!");
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const endTurn = async () => {
    endedRef.current = true;
    try {
      await call("endTurn", { roomId: room.id });
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const scores = standings.slice(0, 6);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 0", alignItems: "stretch" }}>
      {/* Scoreboard */}
      <div style={{ flex: "1 1 160px", maxWidth: "100%", background: color.grid, ...bevel(edge.blue), borderRadius: 4, overflow: "hidden" }}>
        <div style={{ background: color.base, borderBottom: `2px solid ${color.royal}`, padding: "6px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>SCOREBOARD</div>
        {scores.map((p, i) => (
          <div key={p.userId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: i % 2 ? color.grid : color.sky, borderBottom: `1px solid ${color.base}` }}>
            <div style={{ width: 16, height: 16, borderRadius: 9999, background: p.color, border: `1px solid ${color.ink}`, flex: "0 0 auto" }} />
            <div style={{ flex: "1 1 auto", minWidth: 0, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
            <div style={{ fontFamily: font.pixel, fontSize: 10, color: color.ink }}>{p.score}</div>
          </div>
        ))}
        <div style={{ padding: 8, fontSize: 10, lineHeight: 1.3, color: color.ink, background: color.sky }}>
          {isDrawer ? "You are drawing." : isGuesser ? "You are guessing." : "You are watching this turn."}
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: "100 1 420px", minWidth: 0, background: color.base, ...bevel(edge.blue), borderRadius: 6, padding: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: secs <= 10 ? color.red : color.ink, color: color.white, fontFamily: font.pixel, fontSize: 14, padding: "5px 10px", borderRadius: 2 }}>{clockStr(secs)}</div>
            <div
              title={isDrawer ? "Only you can see this — draw it!" : undefined}
              style={{ fontFamily: font.display, fontSize: isDrawer ? 20 : 22, letterSpacing: isDrawer ? "1px" : "6px", color: color.white, WebkitTextStroke: `2px ${color.ink}` }}
            >
              {isDrawer ? wordToDraw || "…" : room.maskedWord}
            </div>
          </div>
          <div style={{ fontFamily: font.pixel, fontSize: 9, color: color.white }}>{room.tier} · {room.points} PTS</div>
        </div>

        <div style={{ position: "relative", background: color.white, border: `2px solid ${color.royal}`, borderRadius: 4, overflow: "hidden" }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            style={{ display: "block", width: "100%", height: "auto", touchAction: "none", cursor: isDrawer ? "crosshair" : "default" }}
          />
          {!isDrawer && (
            <div style={{ position: "absolute", left: 8, top: 8, background: "rgba(33,36,46,.85)", color: color.white, fontFamily: font.pixel, fontSize: 9, padding: "4px 7px", borderRadius: 2 }}>
              WATCHING THE DRAWER
            </div>
          )}
        </div>

        {isDrawer && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {SWATCHES.map((hex) => (
              <button
                key={hex}
                onClick={() => {
                  setBrushColor(hex);
                  setErasing(false);
                }}
                style={{ width: 26, height: 26, background: hex, border: `2px solid ${!erasing && brushColor === hex ? color.orange : color.royal}`, borderRadius: 2, cursor: "pointer" }}
              />
            ))}
            <div style={{ width: 2, height: 24, background: color.royal, margin: "0 4px" }} />
            {BRUSHES.map(([labelTxt, w]) => (
              <button key={labelTxt} onClick={() => setBrush(w)} style={{ background: brush === w ? color.gold : color.white, color: color.ink, border: 0, borderRadius: 2, padding: "6px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", minHeight: 30 }}>
                {labelTxt}
              </button>
            ))}
            <button onClick={() => setErasing(!erasing)} style={{ background: erasing ? color.orange : color.white, color: erasing ? color.white : color.ink, border: `2px solid ${color.royal}`, borderRadius: 2, padding: "5px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".5px", cursor: "pointer", minHeight: 30 }}>
              ERASER
            </button>
            <Button variant="dark" size="sm" onClick={clearBoard} style={{ marginLeft: "auto", padding: "8px 12px", fontSize: 10 }}>CLEAR</Button>
            <Button size="sm" onClick={endTurn} style={{ padding: "8px 14px", fontSize: 10 }}>END TURN ▶</Button>
          </div>
        )}
      </div>

      {/* Guess feed */}
      <div style={{ flex: "1 1 240px", minWidth: 0, background: color.panel, ...bevel(edge.panel), borderRadius: 4, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: color.base, borderBottom: `2px solid ${color.royal}`, padding: "6px 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".5px" }}>GUESS FEED</div>
        <div ref={feedRef} style={{ flex: "1 1 auto", padding: 8, display: "flex", flexDirection: "column", gap: 5, maxHeight: 380, overflowY: "auto" }}>
          {messages.map((m) => {
            const st = chatStyle[m.kind];
            return (
              <div key={m.id} style={{ background: st.bg, borderLeft: `3px solid ${st.edge}`, borderRadius: 2, padding: "5px 7px", fontSize: 11, lineHeight: 1.35, color: st.fg }}>
                <strong>{m.nickname}</strong> {m.text}
              </div>
            );
          })}
          {messages.length === 0 && (
            <div style={{ fontFamily: font.pixel, fontSize: 9, color: color.inkSoft, padding: 6 }}>No guesses yet…</div>
          )}
        </div>
        <div style={{ padding: 8, borderTop: `2px solid ${color.base}`, display: "flex", gap: 5 }}>
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isGuesser && sendGuess()}
            placeholder={isGuesser ? "Type your guess" : "Only the guesser can guess"}
            disabled={!isGuesser}
            style={{ flex: "1 1 auto", minWidth: 0, background: isGuesser ? color.white : "#e7e7e7", border: `1px solid #5a5f8c`, borderRadius: 2, padding: 8, fontSize: 12, minHeight: 36 }}
          />
          <button onClick={() => isGuesser && sendGuess()} disabled={!isGuesser} style={{ background: color.orange, color: color.white, border: 0, borderRadius: 9999, width: 36, height: 36, fontSize: 14, cursor: isGuesser ? "pointer" : "default", opacity: isGuesser ? 1 : 0.5 }}>▶</button>
        </div>
      </div>
    </div>
  );
}
