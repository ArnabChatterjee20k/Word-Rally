/**
 * Confirms canvas-over-presence routing: the sender upserts its OWN user presence
 * and the receiver subscribes to presences.<senderUid> and decodes the strokes.
 *   WR_KEY=<ephemeral-key> bun run scripts/presence-check.ts
 */
(globalThis as any).window = globalThis;
import { Client as Web, Account as WebAccount, Realtime, Channel, Permission, Role } from "appwrite";
import { Client as Srv, Account } from "node-appwrite";

declare const process: { env: Record<string, string | undefined>; exit: (c?: number) => never };
setTimeout(() => process.exit(2), 15000);

const EP = "https://fra.cloud.appwrite.io/v1";
const PROJ = "69df74c0000a309ef8af";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mint(): Promise<{ secret: string; userId: string }> {
  const admin = new Srv().setEndpoint(EP).setProject(PROJ).setKey(process.env.WR_KEY || "");
  const s = await new Account(admin).createAnonymousSession();
  return { secret: s.secret, userId: s.userId };
}

async function main() {
  const A = await mint();
  const B = await mint();
  const cA = new Web().setEndpoint(EP).setProject(PROJ).setSession(A.secret);
  const cB = new Web().setEndpoint(EP).setProject(PROJ).setSession(B.secret);
  // JWT only needed so the Node harness can send presence during the handshake.
  const { jwt } = await new WebAccount(cA).createJWT();
  (cA as any).setJWT(jwt);
  const rtA = new Realtime(cA);
  const rtB = new Realtime(cB);

  let received: any = null;
  await rtB.subscribe(Channel.presence(A.userId), (evt: any) => (received = evt));
  await sleep(2000);

  await rtA.upsertPresence({
    presenceId: A.userId,
    status: "online",
    metadata: { roomId: "r1", role: "drawer", nickname: "Amy", seq: 7, clearVersion: 0, d: JSON.stringify([{ c: "#000", w: 6, e: false, pts: [[1, 2], [3, 4], [5, 6]] }]) },
    permissions: [Permission.read(Role.users()), Permission.update(Role.user(A.userId))],
  });
  await sleep(3000);

  if (!received) {
    console.log("❌ receiver got nothing on presences.<senderUid>");
    process.exit(1);
  }
  const meta = received.payload?.metadata;
  const segs = meta?.d ? JSON.parse(meta.d) : null;
  const ok = received.payload?.$id === A.userId && Array.isArray(segs) && segs[0]?.pts?.length === 3;
  console.log("payload $id:", received.payload?.$id, "=== senderUid:", received.payload?.$id === A.userId);
  console.log("decoded seg pts:", segs?.[0]?.pts?.length);
  console.log(ok ? "✅ routing + decode OK" : "❌ mismatch");
  process.exit(ok ? 0 : 1);
}

await main();
