// Mirror of functions/game/src/logic.js `scoreForWord` — the SERVER is authoritative;
// this only powers the pick-screen display so the shown points match the award.
export function scoreForWord(word: string): { tier: string; points: number } {
  const letters = word.replace(/[^a-zA-Z]/g, "").length;
  if (letters <= 5) return { tier: "EASY", points: 60 };
  if (letters <= 10) return { tier: "MEDIUM", points: 120 };
  return { tier: "HARD", points: 200 };
}
