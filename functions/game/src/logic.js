// Pure game logic — no Appwrite dependencies, so it can be unit-tested directly.

export function normalize(s) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Difficulty + points derived server-side from the word (never trusted from the client). */
export function scoreForWord(word) {
  const letters = String(word).replace(/[^a-zA-Z]/g, "").length;
  if (letters <= 5) return { tier: "EASY", points: 60 };
  if (letters <= 10) return { tier: "MEDIUM", points: 120 };
  return { tier: "HARD", points: 200 };
}

/** "ROCKET SHIP" -> "_ _ _ _ _ _   _ _ _ _" */
export function maskWord(word) {
  return String(word)
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/./g, "_").split("").join(" "))
    .join("   ");
}

/** Like maskWord but reveals the first `n` letters (left-to-right, spaces preserved).
 *  revealMask("ROCKET SHIP", 2) -> "R O _ _ _ _   _ _ _ _" */
export function revealMask(word, n) {
  let shown = 0;
  return String(word)
    .trim()
    .split(/\s+/)
    .map((w) =>
      w
        .split("")
        .map((ch) => {
          if (!/[a-zA-Z]/.test(ch)) return ch;
          if (shown < n) {
            shown += 1;
            return ch.toUpperCase();
          }
          return "_";
        })
        .join(" "),
    )
    .join("   ");
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/** 'exact' | 'near' | 'wrong' */
export function classifyGuess(guess, secret) {
  const g = normalize(guess);
  const s = normalize(secret);
  if (!g) return "wrong";
  if (g === s) return "exact";
  // plural / simple morphology tolerance
  if (g === s + "s" || s === g + "s" || g === s + "es" || s === g + "es") return "near";
  if (levenshtein(g, s) <= 1) return "near";
  return "wrong";
}

/** Point split when the guesser nails it. */
export function awards(points) {
  return { guesser: points, drawer: Math.round(points / 2), picker: 20 };
}

/** Cost of revealing one letter: an even share of the word's points across its
 *  letters, so each reveal forfeits ~(1/letters) of the reward. */
export function hintCost(points, letters) {
  return Math.max(1, Math.round(points / Math.max(1, letters)));
}

/** Role assignment from the rotation order for a given turn index.
 *  With only 2 players the roles collapse: the picker also draws their own word,
 *  the other player guesses (roles still alternate every turn). */
export function rolesForTurn(turnOrder, turnIndex) {
  const n = turnOrder.length;
  if (n <= 2) {
    const p = turnOrder[turnIndex % n];
    return { pickerId: p, drawerId: p, guesserId: turnOrder[(turnIndex + 1) % n] };
  }
  return {
    pickerId: turnOrder[turnIndex % n],
    drawerId: turnOrder[(turnIndex + 1) % n],
    guesserId: turnOrder[(turnIndex + 2) % n],
  };
}

export function roundForTurn(turnIndex, n) {
  return Math.floor(turnIndex / n) + 1;
}

export function isMatchOver(turnIndex, n, totalRounds) {
  return turnIndex >= n * totalRounds;
}

export function makeRoomCode(rand = Math.random) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous O/0/I/1
  let out = "";
  for (let i = 0; i < 4; i++) out += A[Math.floor(rand() * A.length)];
  return out;
}
