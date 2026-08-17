import {
  Client, Account, TablesDB, Functions, Presences, Realtime, Channel,
  ID, Query, Permission, Role,
} from "appwrite";
import { CONFIG } from "../config.ts";

// One client, carrying the anonymous SESSION (cookie). Used for everything: HTTP
// (Account, TablesDB, Functions, presence seed) and the Realtime socket. Realtime
// authenticates with the same session, so subscriptions and presence are scoped to
// the anonymous user — no JWT, no server role.
export const client = new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);
export const presences = new Presences(client);

// One shared Realtime socket for DB subscriptions AND presence (liveness + drawing).
export const realtime = new Realtime(client);

export { ID, Query, Permission, Role, Channel };
