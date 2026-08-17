import {
  Client, Account, TablesDB, Functions, Presences, Realtime, Channel,
  ID, Query, Permission, Role,
} from "appwrite";
import { CONFIG } from "../config.ts";

export const client = new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);
export const presences = new Presences(client);

// One shared Realtime connection: DB subscriptions AND presence (liveness + drawing)
// all ride this single socket. Presence sent over it auto-expires on disconnect.
export const realtime = new Realtime(client);

export { ID, Query, Permission, Role, Channel };
