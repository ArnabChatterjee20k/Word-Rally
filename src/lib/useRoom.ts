import { useEffect, useState } from "react";
import { realtime, tablesDB, Query } from "./appwrite.ts";
import { CONFIG, channels } from "../config.ts";
import { parseMessage, parsePlayer, parseRoom, type Message, type Player, type Room } from "./types.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Subscribes to a room's rooms-row, players, and messages via one Realtime socket.
 *  Players/messages use a server-side realtime query so only this room's events arrive. */
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
    let cancelled = false;
    const subs: any[] = [];
    const rows = (r: any): any[] => r.rows || r.documents || [];

    const loadRoom = () =>
      tablesDB
        .getRow({ databaseId: CONFIG.dbId, tableId: CONFIG.tables.rooms, rowId: roomId })
        .then((r) => !cancelled && setRoom(parseRoom(r)))
        .catch(() => {});
    const loadPlayers = () =>
      tablesDB
        .listRows({
          databaseId: CONFIG.dbId,
          tableId: CONFIG.tables.players,
          queries: [Query.equal("roomId", roomId), Query.limit(100)],
        })
        .then((r) => !cancelled && setPlayers(rows(r).map(parsePlayer)))
        .catch(() => {});
    const loadMessages = () =>
      tablesDB
        .listRows({
          databaseId: CONFIG.dbId,
          tableId: CONFIG.tables.messages,
          queries: [Query.equal("roomId", roomId), Query.orderAsc("$createdAt"), Query.limit(100)],
        })
        .then((r) => !cancelled && setMessages(rows(r).map(parseMessage)))
        .catch(() => {});

    loadRoom();
    loadPlayers();
    loadMessages();

    const onRoom = (evt: any) => {
      if (evt.payload) setRoom(parseRoom(evt.payload));
    };
    const onTable = (evt: any) => {
      const chan = (evt.channels || []).join(" ");
      const p = evt.payload || {};
      if (chan.includes(`.tables.${CONFIG.tables.players}.`)) {
        loadPlayers();
      } else if (chan.includes(`.tables.${CONFIG.tables.messages}.`)) {
        if ((evt.events || []).some((e: string) => e.endsWith(".create")))
          setMessages((prev) => (prev.some((m) => m.id === p.$id) ? prev : [...prev, parseMessage(p)]));
      }
    };

    const track = (pr: Promise<any>) =>
      pr
        .then((s) => {
          if (cancelled) s.unsubscribe();
          else subs.push(s);
        })
        .catch(() => {});

    track(realtime.subscribe(channels.roomRow(roomId), onRoom));
    // Server-side realtime query: only this room's player/message events reach us.
    track(realtime.subscribe([channels.playersTable(), channels.messagesTable()], onTable, [
      Query.equal("roomId", roomId),
    ]));

    return () => {
      cancelled = true;
      subs.forEach((s) => {
        try {
          s.unsubscribe();
        } catch {
          /* noop */
        }
      });
    };
  }, [roomId]);

  return { room, players, messages };
}
