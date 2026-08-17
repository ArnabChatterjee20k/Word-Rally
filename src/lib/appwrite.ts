import { Client, Account, TablesDB, Functions, Presences, ID, Query, Permission, Role } from "appwrite";
import { CONFIG } from "../config.ts";

export const client = new Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);
export const presences = new Presences(client);

export { ID, Query, Permission, Role };
