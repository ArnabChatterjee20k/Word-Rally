import { useEffect, useMemo, useState } from "react";
import { color, dots } from "./theme.ts";
import { pickColor } from "./data.ts";
import type { Player, Room } from "./lib/types.ts";
import { ensureSession } from "./lib/session.ts";
import { call } from "./lib/game.ts";
import { useRoom } from "./lib/useRoom.ts";
import { usePresence } from "./lib/presence.ts";
import { ToastProvider } from "./components/Toast.tsx";
import { Footer, Header, PhaseBar, Splash, StatusBar } from "./components/Chrome.tsx";
import { LandingScreen } from "./screens/LandingScreen.tsx";
import { LobbyScreen } from "./screens/LobbyScreen.tsx";
import { PickScreen } from "./screens/PickScreen.tsx";
import { PlayScreen } from "./screens/PlayScreen.tsx";
import { ScoreScreen } from "./screens/ScoreScreen.tsx";
import { WinnerScreen } from "./screens/WinnerScreen.tsx";

export type Role = "picker" | "drawer" | "guesser" | "spectator";

export type Standing = { userId: string; name: string; color: string; score: number };

export function roleOf(room: Room | null, me: string | null): Role {
  if (!room || !me) return "spectator";
  if (me === room.drawerId) return "drawer";
  if (me === room.guesserId) return "guesser";
  if (me === room.pickerId) return "picker";
  return "spectator";
}

function Game() {
  const [me, setMe] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("wr_roomId");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    ensureSession().then(setMe).catch(() => setMe(null));
  }, []);

  const { room, players, messages } = useRoom(roomId);
  const role = useMemo(() => roleOf(room, me), [room, me]);

  const playersById = useMemo(() => {
    const m = new Map<string, Player>();
    players.forEach((p) => m.set(p.userId, p));
    return m;
  }, [players]);

  const myName = (me && playersById.get(me)?.nickname) || "You";
  const online = usePresence(roomId, me, role, myName);

  const nameOf = (uid: string) => playersById.get(uid)?.nickname ?? "";
  const colorOf = (uid: string) => playersById.get(uid)?.color ?? pickColor(uid);

  const standings: Standing[] = useMemo(() => {
    if (!room) return [];
    return room.turnOrder
      .map((uid) => ({
        userId: uid,
        name: nameOf(uid) || "Player",
        color: colorOf(uid),
        score: room.scores[uid] ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, players]);

  const enterRoom = (id: string) => {
    try {
      localStorage.setItem("wr_roomId", id);
    } catch {
      /* noop */
    }
    setRoomId(id);
  };
  const leaveRoom = () => {
    if (roomId && me) call("leaveRoom", { roomId }).catch(() => {});
    try {
      localStorage.removeItem("wr_roomId");
    } catch {
      /* noop */
    }
    setRoomId(null);
  };

  const endMatch = () => {
    if (roomId) call("endMatch", { roomId }).catch(() => {});
  };

  const onlineCount = Object.keys(online).length;

  let content: React.ReactNode;
  if (!me) content = <Splash text="Connecting…" />;
  else if (!roomId) content = <LandingScreen me={me} onEnter={enterRoom} />;
  else if (!room) content = <Splash text="Loading room…" />;
  else if (room.status === "lobby")
    content = (
      <LobbyScreen room={room} players={players} me={me} online={online} onLeave={leaveRoom} />
    );
  else if (room.status === "pick") content = <PickScreen room={room} me={me} nameOf={nameOf} />;
  else if (room.status === "play")
    content = (
      <PlayScreen
        room={room}
        me={me}
        role={role}
        messages={messages}
        standings={standings}
        myName={myName}
      />
    );
  else if (room.status === "score")
    content = <ScoreScreen room={room} standings={standings} nameOf={nameOf} me={me} />;
  else content = <WinnerScreen room={room} standings={standings} me={me} onLeave={leaveRoom} />;

  return (
    <div style={{ minHeight: "100vh", background: color.base, ...dots(color.grid, 4), padding: "0 0 40px 0" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "10px 12px 0 12px" }}>
        <Header room={room} />
        {room && (
          <>
            <PhaseBar status={room.status} />
            <StatusBar
              room={room}
              nameOf={nameOf}
              onlineCount={onlineCount}
              onLeave={leaveRoom}
              onEndMatch={
                me === room.hostId && room.status !== "lobby" && room.status !== "winner"
                  ? endMatch
                  : undefined
              }
            />
          </>
        )}
        {content}
        <Footer />
      </div>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Game />
    </ToastProvider>
  );
}
