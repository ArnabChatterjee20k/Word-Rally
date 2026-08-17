// Tiny 8-bit sound synth via the Web Audio API — no asset files. All SFX are short
// oscillator blips that fit the arcade aesthetic. Muteable + persisted.

/* eslint-disable @typescript-eslint/no-explicit-any */

let muted = false;
try {
  muted = localStorage.getItem("wr_muted") === "1";
} catch {
  /* noop */
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted() {
  return muted;
}
export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem("wr_muted", v ? "1" : "0");
  } catch {
    /* noop */
  }
  if (!v) audio(); // unlock the context on unmute (user gesture)
}
export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

/** Unlock audio on the first user gesture (browsers block autoplay until then). */
export function primeAudio() {
  if (!muted) audio();
}

function tone(freq: number, dur: number, type: OscillatorType = "square", gain = 0.06, delay = 0) {
  if (muted) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function seq(notes: number[], step = 0.08, dur = 0.12, type: OscillatorType = "square", gain = 0.06) {
  notes.forEach((f, i) => tone(f, dur, type, gain, i * step));
}

export const sfx = {
  correct: () => seq([523, 659, 784, 1047], 0.08, 0.13, "square", 0.06),
  wrong: () => {
    tone(196, 0.16, "sawtooth", 0.05);
    tone(130, 0.2, "sawtooth", 0.05, 0.06);
  },
  near: () => seq([660, 880], 0.1, 0.09, "triangle", 0.05),
  start: () => seq([440, 660], 0.09, 0.1, "square", 0.06),
  win: () => seq([523, 659, 784, 1047, 1319], 0.11, 0.16, "square", 0.07),
  join: () => seq([880, 1175], 0.07, 0.08, "square", 0.05),
  tick: () => tone(1000, 0.03, "square", 0.04),
  click: () => tone(320, 0.03, "square", 0.03),
};
