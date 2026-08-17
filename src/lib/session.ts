import { account } from "./appwrite.ts";

/** Ensure an anonymous guest session exists; return the user id. */
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
