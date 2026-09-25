import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useClinicalSession } from "@/hooks/use-clinical-session";
import { useVisualViewportFit } from "@/hooks/use-visual-viewport";
import { AppShell } from "@/components/app-shell";
import { StartScreen } from "@/components/screens/start-screen";
import { ChatScreen } from "@/components/screens/chat-screen";
import { EndedScreen } from "@/components/screens/ended-screen";

const params = new URLSearchParams(window.location.search);

export default function App() {
  const { t } = useTranslation();
  const session = useClinicalSession({
    visitIdFromUrl: (params.get("visit") || "").trim(),
    voiceFromUrl: params.get("voice"),
    t,
  });
  useVisualViewportFit(session.screen);

  // focus the screen heading on screen transitions (not on first mount)
  const prevScreen = useRef(session.screen);
  useEffect(() => {
    if (prevScreen.current !== session.screen) {
      prevScreen.current = session.screen;
      const el = document.getElementById("screen-title");
      el?.focus({ preventScroll: true });
    }
  }, [session.screen]);

  return (
    <AppShell screen={session.screen} visitId={session.visitId}>
      {session.screen === "start" && <StartScreen session={session} />}
      {session.screen === "chat" && <ChatScreen session={session} />}
      {session.screen === "ended" && <EndedScreen session={session} />}
    </AppShell>
  );
}
