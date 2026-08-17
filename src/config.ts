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
  },
} as const;

// Realtime channel helpers (TablesDB channels: tablesdb.<db>.tables.<table>.rows[.<row>])
export const channels = {
  roomRow: (roomId: string) => `tablesdb.${CONFIG.dbId}.tables.rooms.rows.${roomId}`,
  playersTable: () => `tablesdb.${CONFIG.dbId}.tables.players.rows`,
  messagesTable: () => `tablesdb.${CONFIG.dbId}.tables.messages.rows`,
  presence: (id: string) => `presences.${id}`,
  presences: () => `presences`,
};

// Presence ids
export const presenceIds = {
  canvas: (roomId: string) => `${roomId}_canvas`.slice(0, 36),
  user: (uid: string) => uid.slice(0, 36),
};
