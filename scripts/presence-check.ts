/**
 * Diagnoses the canvas-over-presence transport on the real project.
 *   WR_KEY=<ephemeral-key> bun run scripts/presence-check.ts
 */
(globalThis as any).window = globalThis;
import { Client as Web, Realtime, Channel, Presences, Permission, Role } from "appwrite";
import { Client as Srv, Account } from "node-appwrite";

declare const process: { env: Record<string, string | undefined>; exit: (code?: number) => never };
setTimeout(() => {
  console.log("⏱  done");
  process.exit(0);
}, 16000);

const EP = "https://fra.cloud.appwrite.io/v1";
const PROJ = "69df74c0000a309ef8af";
const CID = "e2ecanvas";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mintSecret(): Promise<string> {
  const admin = new Srv().setEndpoint(EP).setProject(PROJ).setKey(process.env.WR_KEY || "");
  const s = await new Account(admin).createAnonymousSession();
  return s.secret;
}

async function main() {
  const [secA, secB] = [await mintSecret(), await mintSecret()];
  const cA = new Web().setEndpoint(EP).setProject(PROJ).setSession(secA);
  const cB = new Web().setEndpoint(EP).setProject(PROJ).setSession(secB);
  // Authorize A's realtime connection with a JWT (carried in the socket URL).
  try {
    const { jwt } = await new (await import("appwrite")).Account(cA).createJWT();
    (cA as any).setJWT(jwt);
    console.log("A: JWT set");
  } catch (e: any) {
    console.log("A: JWT error:", e?.message);
  }
  const rtA = new Realtime(cA);
  const rtB = new Realtime(cB);

  rtB.onOpen(() => console.log("B: socket open"));
  rtB.onError((e: any) => console.log("B: error:", e?.message));
  rtA.onError((e: any) => console.log("A: error:", e?.message));

  await rtB.subscribe([Channel.presences(), Channel.presence(CID)], (evt: any) => {
    console.log("B RECV events=", JSON.stringify(evt.events), "channels=", JSON.stringify(evt.channels));
    console.log("   payload=", JSON.stringify(evt.payload).slice(0, 300));
  });
  await sleep(2500);

  console.log("→ A: socket upsertPresence…");
  await rtA.upsertPresence({
    presenceId: CID,
    status: "drawing",
    metadata: { seq: 1, clearVersion: 0, d: JSON.stringify([{ c: "#e60012", w: 6, e: false, pts: [[1, 2], [3, 4]] }]) },
    permissions: [Permission.read(Role.users()), Permission.update(Role.users())],
  });
  await sleep(3500);

  console.log("→ A: HTTP Presences.upsert…");
  try {
    await new Presences(cA).upsert({
      presenceId: CID + "http",
      status: "online",
      metadata: { hello: "world" },
      permissions: [Permission.read(Role.users()), Permission.update(Role.users())],
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    } as any);
    console.log("   HTTP upsert ok");
  } catch (e: any) {
    console.log("   HTTP upsert error:", e?.message);
  }
  await sleep(4000);
  console.log("(waited; see events above)");
}

await main();
