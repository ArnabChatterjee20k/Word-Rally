import { Channel } from "appwrite";

// Public Appwrite config (safe to ship to the browser).
// EDIT the endpoint + projectId for your self-hosted instance, or set them at runtime
// in the browser console via localStorage: wr_endpoint / wr_project, then reload.

const ls = (k: string): string | null => {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(k) : null;
  } catch {
    return null;
  }
};

export const CONFIG = {
  endpoint: ls("wr_endpoint") || "https://fra.cloud.appwrite.io/v1",
  projectId: ls("wr_project") || "69df74c0000a309ef8af",
  dbId: "wordrally",
  functionId: "game",
  tables: {
    rooms: "rooms",
    players: "players",
    messages: "messages",
    secretWords: "secretWords",
    results: "results",
  },
} as const;

// Realtime channels built with the SDK's Channel helper (used with new Realtime()).
export const channels = {
  roomRow: (roomId: string) => Channel.tablesdb(CONFIG.dbId).table(CONFIG.tables.rooms).row(roomId),
  playersTable: () => Channel.tablesdb(CONFIG.dbId).table(CONFIG.tables.players).row(),
  messagesTable: () => Channel.tablesdb(CONFIG.dbId).table(CONFIG.tables.messages).row(),
  // Socket presence is keyed by the sender's user id, so the drawer broadcasts on
  // its own user presence and guessers watch presences.<drawerId>.
  drawerPresence: (drawerId: string) => Channel.presence(drawerId),
  presences: () => Channel.presences(),
};

// Presence ids
export const presenceIds = {
  user: (uid: string) => uid.slice(0, 36),
};
