import { account } from "./appwrite.ts";

/** Ensure an anonymous guest session exists; return the user id. The same session
 *  (cookie) scopes both HTTP calls and the Realtime socket (subscriptions + presence). */
export async function ensureSession(): Promise<string> {
  try {
    const u = await account.get();
    return u.$id;
  } catch {
    await account.createAnonymousSession();
    const u = await account.get();
    return u.$id;
  }
}
