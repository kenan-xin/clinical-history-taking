import { useCallback, useEffect, useRef, useState } from "react";
import { GeminiClient } from "@/lib/gemini-client";
import { MediaHandler, type VideoKind } from "@/lib/media-handler";
import { isServerEvent } from "@/lib/protocol";

export type Screen = "start" | "chat" | "ended";
export type MicState = "off" | "on" | "blocked";

export type ChatItem =
  | { id: number; kind: "user" | "gemini"; text: string; time: number }
  | { id: number; kind: "note"; text: string; time: number };

export const VOICES = [
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Aoede",
  "Leda",
  "Orus",
  "Zephyr",
] as const;

const VISIT_RE = /^[A-Za-z0-9][A-Za-z0-9-]{3,}$/;
export function isValidVisitId(v: string) {
  return VISIT_RE.test(v);
}

let nextId = 1;

interface Options {
  visitIdFromUrl: string;
  voiceFromUrl: string | null;
  t: (key: string) => string;
}

export function useClinicalSession({ visitIdFromUrl, voiceFromUrl, t }: Options) {
  const [screen, setScreen] = useState<Screen>("start");
  const [visitId, setVisitId] = useState(visitIdFromUrl);
  const [voice, setVoice] = useState(
    voiceFromUrl && VOICES.includes(voiceFromUrl as (typeof VOICES)[number])
      ? voiceFromUrl
      : "Puck",
  );
  const [restart, setRestart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [mic, setMic] = useState<MicState>("off");
  const [video, setVideo] = useState<VideoKind | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [startError, setStartError] = useState("");
  const [endedError, setEndedError] = useState("");
  const [endedLost, setEndedLost] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const busyRef = useRef(false);
  // one pending-start at a time per channel; otherwise a second tap during a
  // permission prompt would double-start capture (leaked streams, doubled audio)
  const micPendingRef = useRef(false);
  const videoPendingRef = useRef(false);

  // Mirror of `t` for the frozen WebSocket callbacks (language can change
  // mid-session; the client is created once).
  const tRef = useRef(t);
  tRef.current = t;

  // Mutable side-channel for the client callbacks (they must read current values
  // without re-creating the WebSocket client).
  const ref = useRef({
    resuming: false,
    endedByUser: false,
    opened: false,
    visitId,
    restart,
    userBubble: null as number | null,
    geminiBubble: null as number | null,
    thinkTimer: null as ReturnType<typeof setTimeout> | null,
  });
  ref.current.visitId = visitId;
  ref.current.restart = restart;

  const mediaRef = useRef<MediaHandler | null>(null);
  const clientRef = useRef<GeminiClient | null>(null);
  const getMedia = () => (mediaRef.current ??= new MediaHandler());
  const getClient = () => {
    if (clientRef.current) return clientRef.current;
    clientRef.current = new GeminiClient({
      onOpen: () => {
        ref.current.opened = true;
        setBusy(false);
        setScreen("chat");
        setComposerOpen(
          window.matchMedia("(min-width: 64rem) and (pointer: fine)").matches,
        );
        if (!ref.current.resuming) {
          const prefix = ref.current.restart ? "Restart Session" : "Start Session";
          clientRef.current!.sendText(`${prefix}: ${ref.current.visitId}`);
          ref.current.restart = false;
          setRestart(false);
          showThinking();
        }
        startMic();
      },
      onJsonEvent: (event) => {
        if (!isServerEvent(event)) return;
        if (event.type === "interrupted") {
          getMedia().stopAudioPlayback();
          ref.current.userBubble = null;
          ref.current.geminiBubble = null;
          hideThinking();
        } else if (event.type === "turn_complete") {
          ref.current.userBubble = null;
          ref.current.geminiBubble = null;
          hideThinking();
        } else if (event.type === "user") {
          appendDelta("user", event.text);
          // Patient paused and no reply yet: the intake agent is working (it can
          // take many seconds), so surface a thinking indicator after a beat.
          if (ref.current.thinkTimer) clearTimeout(ref.current.thinkTimer);
          ref.current.thinkTimer = setTimeout(() => {
            if (ref.current.geminiBubble === null) showThinking();
          }, 1200);
        } else if (event.type === "gemini") {
          hideThinking();
          appendDelta("gemini", event.text);
        } else if (event.type === "error") {
          hideThinking();
          addNote(tRef.current("err_server"));
        } else if (event.type === "tool_call") {
          console.debug("tool_call", event.name, event.args, event.result);
        }
      },
      onAudio: (data) => getMedia().playAudio(data),
      onClose: () => {
        stopMedia();
        setBusy(false);
        busyRef.current = false;
        hideThinking();
        if (!ref.current.opened) {
          if (ref.current.resuming) {
            // resume initiated from the ended screen: stay there with the error
            setEndedError(tRef.current("err_connect"));
            return;
          }
          setItems([]);
          setStartError(tRef.current("err_connect"));
          setScreen("start");
          return;
        }
        setEndedLost(!ref.current.endedByUser);
        setScreen("ended");
      },
      onError: (e) => console.error("WS error:", e), // onClose follows and shows the message
    });
    return clientRef.current;
  };

  const appendDelta = useCallback(
    (kind: "user" | "gemini", text: string) => {
      const bubbleKey = kind === "user" ? "userBubble" : "geminiBubble";
      const existing = ref.current[bubbleKey];
      if (existing !== null) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === existing && item.kind !== "note"
              ? { ...item, text: item.text + text }
              : item,
          ),
        );
      } else {
        const id = nextId++;
        ref.current[bubbleKey] = id;
        setItems((prev) => [...prev, { id, kind, text, time: Date.now() }]);
      }
    },
    [],
  );

  const addNote = useCallback((text: string) => {
    setItems((prev) => [...prev, { id: nextId++, kind: "note", text, time: Date.now() }]);
  }, []);

  const showThinking = useCallback(() => {
    setThinking(true);
  }, []);

  const hideThinking = useCallback(() => {
    if (ref.current.thinkTimer) clearTimeout(ref.current.thinkTimer);
    setThinking(false);
  }, []);

  const startMic = useCallback(async () => {
    if (micPendingRef.current) return;
    micPendingRef.current = true;
    try {
      await getMedia().startAudio((data) => {
        if (clientRef.current?.isConnected()) clientRef.current.send(data);
      });
      setMic("on");
    } catch {
      setMic("blocked");
      setComposerOpen(true);
    } finally {
      micPendingRef.current = false;
    }
  }, []);

  const stopMic = useCallback(() => {
    getMedia().stopAudio();
    setMic("off");
  }, []);

  const toggleMic = useCallback(() => {
    if (mic === "on") stopMic();
    else startMic();
  }, [mic, startMic, stopMic]);

  const stopVideo = useCallback(() => {
    getMedia().stopVideo(videoRef.current);
    setVideo(null);
  }, []);

  const sendFrame = useCallback((b64: string) => {
    if (clientRef.current?.isConnected()) clientRef.current.sendImage(b64);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (videoPendingRef.current) return;
    if (video === "camera") return stopVideo();
    if (video) stopVideo();
    videoPendingRef.current = true;
    try {
      await getMedia().startVideo(videoRef.current!, sendFrame);
      setVideo("camera");
    } catch {
      getMedia().stopVideo(videoRef.current); // don't leave the stream running
      addNote(t("err_cam"));
    } finally {
      videoPendingRef.current = false;
    }
  }, [video, stopVideo, sendFrame, addNote, t]);

  const toggleScreen = useCallback(async () => {
    if (videoPendingRef.current) return;
    if (video === "screen") return stopVideo();
    if (video) stopVideo();
    videoPendingRef.current = true;
    try {
      await getMedia().startScreen(videoRef.current!, sendFrame, () => {
        setVideo(null);
      });
      setVideo("screen");
    } catch {
      getMedia().stopVideo(videoRef.current); // user cancelled the share prompt
    } finally {
      videoPendingRef.current = false;
    }
  }, [video, stopVideo, sendFrame]);

  const stopMedia = useCallback(() => {
    const media = getMedia();
    media.stopAudio();
    media.stopAudioPlayback();
    media.stopVideo(videoRef.current);
    setMic("off");
    setSpeaking(false);
  }, []);

  const connect = useCallback(
    async ({
      resume = false,
      visitId: vid,
    }: { resume?: boolean; visitId?: string } = {}) => {
      if (busyRef.current) return;
      if (vid !== undefined) {
        ref.current.visitId = vid;
        setVisitId(vid);
      }
      busyRef.current = true;
      setBusy(true);
      setStartError("");
      setEndedError("");
      ref.current.resuming = resume;
      ref.current.endedByUser = false;
      ref.current.opened = false;
      ref.current.userBubble = null;
      ref.current.geminiBubble = null;
      if (!resume) setItems([]); // a fresh session never keeps the old transcript
      try {
        await getMedia().initializeAudio(); // must run inside the tap
        getClient().connect(voice, resume);
      } catch (e) {
        console.error(e);
        busyRef.current = false;
        setBusy(false);
        if (resume) setEndedError(t("err_audio"));
        else setStartError(t("err_audio"));
        ref.current.resuming = false;
      }
    },
    [voice, t],
  );

  const sendTyped = useCallback(
    (text: string) => {
      if (!clientRef.current?.isConnected()) {
        addNote(tRef.current("err_offline"));
        return false;
      }
      clientRef.current.sendText(text);
      ref.current.userBubble = null;
      setItems((prev) => [
        ...prev,
        { id: nextId++, kind: "user", text, time: Date.now() },
      ]);
      showThinking();
      return true;
    },
    [addNote, showThinking],
  );

  const endSession = useCallback(() => {
    ref.current.endedByUser = true;
    // disconnect() detaches the socket handlers, so onClose will NOT fire —
    // this epilogue runs the transition the close event would have triggered.
    clientRef.current?.disconnect();
    stopMedia();
    busyRef.current = false;
    setBusy(false);
    hideThinking();
    setEndedLost(false);
    setScreen("ended");
  }, [stopMedia, hideThinking]);

  const startNew = useCallback(() => {
    hideThinking();
    ref.current.userBubble = null;
    ref.current.geminiBubble = null;
    setItems([]);
    setEndedError("");
    setScreen("start");
  }, [hideThinking]);

  // "Assistant is speaking" polls the playback queue, like the design's 250ms renderState tick.
  useEffect(() => {
    if (screen !== "chat") return;
    const timer = setInterval(() => {
      setSpeaking(mediaRef.current?.isSpeaking() ?? false);
    }, 250);
    return () => clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    return () => {
      // unmount cleanup
      if (ref.current.thinkTimer) clearTimeout(ref.current.thinkTimer);
      clientRef.current?.disconnect();
      mediaRef.current?.stopAudio();
      mediaRef.current?.stopAudioPlayback();
      mediaRef.current?.stopVideo(null);
    };
  }, []);

  // desktop: Ctrl/Cmd+M toggles the mic
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "m" &&
        screen === "chat"
      ) {
        e.preventDefault();
        toggleMic();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [screen, toggleMic]);

  const showScreenShare = (() => {
    // design: screen button only when display capture exists and there is a fine pointer
    return (
      typeof navigator.mediaDevices?.getDisplayMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches
    );
  })();

  return {
    // state
    screen,
    visitId,
    setVisitId,
    voice,
    setVoice,
    restart,
    setRestart,
    busy,
    items,
    thinking,
    speaking,
    mic,
    video,
    composerOpen,
    setComposerOpen,
    startError,
    endedError,
    setEndedError,
    endedLost,
    videoRef,
    showScreenShare,
    // actions
    connect,
    toggleMic,
    toggleCamera,
    toggleScreen,
    sendTyped,
    endSession,
    startNew,
  };
}
