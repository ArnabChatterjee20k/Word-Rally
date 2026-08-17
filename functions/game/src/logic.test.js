import { expect, test } from "bun:test";
import {
  normalize,
  scoreForWord,
  maskWord,
  classifyGuess,
  awards,
  rolesForTurn,
  roundForTurn,
  isMatchOver,
  makeRoomCode,
} from "./logic.js";

test("normalize collapses case and whitespace", () => {
  expect(normalize("  Rocket   SHIP ")).toBe("rocket ship");
});

test("scoreForWord tiers by letter count", () => {
  expect(scoreForWord("KITE")).toEqual({ tier: "EASY", points: 60 });
  expect(scoreForWord("ROCKET SHIP")).toEqual({ tier: "MEDIUM", points: 120 });
  expect(scoreForWord("STAGE FRIGHT")).toEqual({ tier: "HARD", points: 200 });
});

test("maskWord hides letters, keeps word gaps", () => {
  expect(maskWord("ROCKET SHIP")).toBe("_ _ _ _ _ _   _ _ _ _");
});

test("classifyGuess: exact / near / wrong", () => {
  expect(classifyGuess("rocket ship", "ROCKET SHIP")).toBe("exact");
  expect(classifyGuess("rocket ships", "rocket ship")).toBe("near"); // plural
  expect(classifyGuess("rocket shup", "rocket ship")).toBe("near"); // 1 edit
  expect(classifyGuess("banana", "rocket ship")).toBe("wrong");
  expect(classifyGuess("", "rocket ship")).toBe("wrong");
});

test("awards split points", () => {
  expect(awards(120)).toEqual({ guesser: 120, drawer: 60, picker: 20 });
});

test("rolesForTurn rotates one seat per turn", () => {
  const order = ["a", "b", "c", "d"];
  expect(rolesForTurn(order, 0)).toEqual({ pickerId: "a", drawerId: "b", guesserId: "c" });
  expect(rolesForTurn(order, 1)).toEqual({ pickerId: "b", drawerId: "c", guesserId: "d" });
  expect(rolesForTurn(order, 4)).toEqual({ pickerId: "a", drawerId: "b", guesserId: "c" });
});

test("round + match-over math", () => {
  expect(roundForTurn(0, 4)).toBe(1);
  expect(roundForTurn(4, 4)).toBe(2);
  expect(isMatchOver(20, 4, 5)).toBe(true);
  expect(isMatchOver(19, 4, 5)).toBe(false);
});

test("makeRoomCode is 4 unambiguous chars", () => {
  const code = makeRoomCode(() => 0.5);
  expect(code).toHaveLength(4);
  expect(code).toMatch(/^[A-Z2-9]{4}$/);
  expect(code).not.toMatch(/[OI01]/);
});
