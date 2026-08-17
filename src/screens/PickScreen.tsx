import { useMemo, useState } from "react";
import { bevel, color, displayTitle, edge, font } from "../theme.ts";
import { pickWordChoices } from "../data.ts";
import { call } from "../lib/game.ts";
import type { Room } from "../lib/types.ts";
import { Button } from "../components/Button.tsx";
import { useToast } from "../components/Toast.tsx";

export function PickScreen({
  room,
  me,
  nameOf,
}: {
  room: Room;
  me: string;
  nameOf: (uid: string) => string;
}) {
  const toast = useToast();
  const [customWord, setCustomWord] = useState("");
  const [busy, setBusy] = useState(false);
  // Fresh suggestions each pick turn (stable within the turn).
  const choices = useMemo(() => pickWordChoices(), [room.turnIndex]);

  // Decide by pickerId directly — with 2 players the picker is also the drawer,
  // so the derived role would be "drawer" and hide the picker UI.
  const isPicker = me === room.pickerId;

  const submit = async (word: string) => {
    const w = word.trim();
    if (!w) return toast("Type a word first");
    setBusy(true);
    try {
      await call("pickWord", { roomId: room.id, word: w });
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
            {isPicker ? "YOUR TURN TO PICK" : `WAITING ON ${nameOf(room.pickerId).toUpperCase()}`} —{" "}
            {nameOf(room.pickerId)}
          </div>
          <div style={displayTitle(40, "#0d2f3a")}>{isPicker ? "CHOOSE A WORD" : "PICKING…"}</div>
        </div>
        <div style={{ fontSize: 12, color: color.white, fontWeight: 700, textAlign: "right", lineHeight: 1.5 }}>
          {nameOf(room.drawerId)} will draw it.
          <br />
          {nameOf(room.guesserId)} will guess it.
          <br />
          Harder words score more.
        </div>
      </div>

      {isPicker ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
              padding: "16px 0",
            }}
          >
            {choices.map((w) => (
              <button
                key={w.word}
                disabled={busy}
                onClick={() => submit(w.word)}
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
                  <span style={{ background: color.gold, color: color.ink, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 2 }}>
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
              onKeyDown={(e) => e.key === "Enter" && submit(customWord)}
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
            <Button onClick={() => submit(customWord)} style={{ padding: "10px 18px", opacity: busy ? 0.6 : 1 }}>
              LOCK IT IN ▶
            </Button>
          </div>
        </>
      ) : (
        <div
          style={{
            background: color.panel,
            ...bevel(edge.panel),
            borderRadius: 6,
            margin: "16px 0",
            padding: 40,
            textAlign: "center",
            fontFamily: font.pixel,
            fontSize: 12,
            color: color.ink,
          }}
        >
          {nameOf(room.pickerId)} is choosing a word — hang tight.
        </div>
      )}
    </>
  );
}
