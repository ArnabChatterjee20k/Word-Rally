import { useEffect, useState } from "react";
import { client, tablesDB, Query } from "./appwrite.ts";
import { CONFIG, channels } from "../config.ts";
import { parseMessage, parsePlayer, parseRoom, type Message, type Player, type Room } from "./types.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Subscribes to a room's rooms-row, players, and messages over Realtime. */
export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setPlayers([]);
      setMessages([]);
      return;
    }
    let alive = true;
    const rows = (r: any): any[] => r.rows || r.documents || [];

    const loadRoom = () =>
      tablesDB
        .getRow({ databaseId: CONFIG.dbId, tableId: CONFIG.tables.rooms, rowId: roomId })
        .then((r) => alive && setRoom(parseRoom(r)))
        .catch(() => {});
    const loadPlayers = () =>
      tablesDB
        .listRows({
          databaseId: CONFIG.dbId,
          tableId: CONFIG.tables.players,
          queries: [Query.equal("roomId", roomId), Query.limit(100)],
        })
        .then((r) => alive && setPlayers(rows(r).map(parsePlayer)))
        .catch(() => {});
    const loadMessages = () =>
      tablesDB
        .listRows({
          databaseId: CONFIG.dbId,
          tableId: CONFIG.tables.messages,
          queries: [Query.equal("roomId", roomId), Query.orderAsc("$createdAt"), Query.limit(100)],
        })
        .then((r) => alive && setMessages(rows(r).map(parseMessage)))
        .catch(() => {});

    loadRoom();
    loadPlayers();
    loadMessages();

    const unsub = client.subscribe(
      [channels.roomRow(roomId), channels.playersTable(), channels.messagesTable()],
      (evt: any) => {
        const chan = (evt.channels || []).join(" ");
        const p = evt.payload || {};
        if (chan.includes(".tables.rooms.")) setRoom(parseRoom(p));
        else if (chan.includes(".tables.players.")) {
          if (p.roomId === roomId) loadPlayers();
        } else if (chan.includes(".tables.messages.")) {
          if (p.roomId === roomId)
            setMessages((prev) => (prev.some((m) => m.id === p.$id) ? prev : [...prev, parseMessage(p)]));
        }
      },
    );

    return () => {
      alive = false;
      try {
        unsub();
      } catch {
        /* noop */
      }
    };
  }, [roomId]);

  return { room, players, messages };
}
