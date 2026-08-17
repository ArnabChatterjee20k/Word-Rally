import { useEffect, useState } from "react";
import { color, dots } from "./theme.ts";
import { INITIAL_CHAT, MATCH, type ChatMsg, type Screen } from "./data.ts";
import { ToastProvider, useToast } from "./components/Toast.tsx";
import { Footer, Header, StatusBar, Tabs } from "./components/Chrome.tsx";
import { LandingScreen } from "./screens/LandingScreen.tsx";
import { LobbyScreen } from "./screens/LobbyScreen.tsx";
import { PickScreen } from "./screens/PickScreen.tsx";
import { PlayScreen } from "./screens/PlayScreen.tsx";
import { ScoreScreen } from "./screens/ScoreScreen.tsx";
import { WinnerScreen } from "./screens/WinnerScreen.tsx";
import { ChatScreen } from "./screens/ChatScreen.tsx";

export type Role = "drawer" | "guesser";

function Game() {
  const toast = useToast();

  const [screen, setScreen] = useState<Screen>("landing");
  const [role, setRole] = useState<Role>("drawer");
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [customWord, setCustomWord] = useState("");
  const [guess, setGuess] = useState("");
  const [secs, setSecs] = useState(47);
  const [brushColor, setBrushColor] = useState("#21242e");
  const [brush, setBrush] = useState(6);
  const [erasing, setErasing] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>(INITIAL_CHAT);

  const go = (s: Screen) => setScreen(s);

  // Turn countdown — only ticks while on the play screen.
  useEffect(() => {
    if (screen !== "play") return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : s)), 1000);
    return () => clearInterval(id);
  }, [screen]);

  const sendGuess = () => {
    const g = guess.trim();
    if (!g) return;
    const right = g.toLowerCase() === MATCH.answer;
    setChat((c) => [...c, { who: "You", text: g, kind: right ? "right" : "wrong" }]);
    setGuess("");
    if (right) toast("CORRECT — round locked!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.base,
        ...dots(color.grid, 4),
        padding: "0 0 40px 0",
      }}
    >
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "10px 12px 0 12px" }}>
        <Header />
        <Tabs screen={screen} go={go} />
        <StatusBar />

        {screen === "landing" && (
          <LandingScreen
            go={go}
            nickname={nickname}
            setNickname={setNickname}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
          />
        )}
        {screen === "lobby" && <LobbyScreen go={go} />}
        {screen === "pick" && (
          <PickScreen go={go} customWord={customWord} setCustomWord={setCustomWord} />
        )}
        {screen === "play" && (
          <PlayScreen
            go={go}
            role={role}
            setRole={setRole}
            brushColor={brushColor}
            setBrushColor={setBrushColor}
            brush={brush}
            setBrush={setBrush}
            erasing={erasing}
            setErasing={setErasing}
            secs={secs}
            guess={guess}
            setGuess={setGuess}
            chat={chat}
            sendGuess={sendGuess}
          />
        )}
        {screen === "score" && <ScoreScreen go={go} />}
        {screen === "winner" && <WinnerScreen go={go} />}
        {screen === "chat" && <ChatScreen />}

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
