import { functions } from "./appwrite.ts";
import { CONFIG } from "../config.ts";

export type Action =
  | "createRoom"
  | "joinRoom"
  | "startMatch"
  | "pickWord"
  | "submitGuess"
  | "endTurn"
  | "nextTurn"
  | "rematch";

/** RPC to the server-authoritative `game` Appwrite Function. */
export async function call<T = any>(action: Action, payload: Record<string, unknown> = {}): Promise<T> {
  const exec = await functions.createExecution({
    functionId: CONFIG.functionId,
    body: JSON.stringify({ action, ...payload }),
  });
  let out: any = {};
  try {
    out = JSON.parse(exec.responseBody || "{}");
  } catch {
    throw new Error("Bad server response");
  }
  if (out.error) throw new Error(out.error);
  return out as T;
}
