import {
  Client, Account, TablesDB, Functions, Presences, Realtime, Channel,
  ID, Query, Permission, Role,
} from "appwrite";
import { CONFIG } from "../config.ts";

// Main client: carries the anonymous SESSION, used for all HTTP (Account, TablesDB,
// Functions, presence seed).
export const client = new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.projectId);

// Realtime client: carries a JWT (minted from the session) instead of the cookie —
// a connection must be JWT-authorized to SEND presence over the socket, and a client
// can't hold both a cookie and a JWT in one request. So realtime gets its own client.
export const rtClient = new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);
export const presences = new Presences(client);

// One shared Realtime socket for DB subscriptions AND presence (liveness + drawing).
export const realtime = new Realtime(rtClient);

export { ID, Query, Permission, Role, Channel };
