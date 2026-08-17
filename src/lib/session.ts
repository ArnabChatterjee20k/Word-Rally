import { account, rtClient } from "./appwrite.ts";

// JWTs from account.createJWT() live ~15 min; refresh comfortably inside that window.
const JWT_REFRESH_MS = 14 * 60 * 1000;

/** Mint a JWT from the current session and hand it to the realtime client, so its
 *  socket is authorized to send presence. */
async function refreshRealtimeJwt(): Promise<void> {
  try {
    const { jwt } = await account.createJWT();
    rtClient.setJWT(jwt);
  } catch {
    /* presence send will simply be unauthorized until the next refresh */
  }
}

/** Ensure an anonymous guest session, authorize the realtime connection with a JWT,
 *  and keep that JWT fresh. Returns the user id. */
export async function ensureSession(): Promise<string> {
  try {
    await account.get();
  } catch {
    await account.createAnonymousSession();
  }
  const me = await account.get();
  await refreshRealtimeJwt();
  setInterval(refreshRealtimeJwt, JWT_REFRESH_MS);
  return me.$id;
}
