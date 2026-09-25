/**
 * GeminiClient: WebSocket communication with the FastAPI backend.
 * TypeScript port of the vanilla gemini-client.js — same wire format.
 */
export class GeminiClient {
  private websocket: WebSocket | null = null;
  private readonly onOpen: () => void;
  private readonly onJsonEvent: (event: unknown) => void;
  private readonly onAudio: (data: ArrayBuffer) => void;
  private readonly onClose: (event: CloseEvent) => void;
  private readonly onError: (event: Event) => void;

  constructor(config: {
    onOpen: () => void;
    onJsonEvent: (event: unknown) => void;
    onAudio: (data: ArrayBuffer) => void;
    onClose: (event: CloseEvent) => void;
    onError: (event: Event) => void;
  }) {
    this.onOpen = config.onOpen;
    this.onJsonEvent = config.onJsonEvent;
    this.onAudio = config.onAudio;
    this.onClose = config.onClose;
    this.onError = config.onError;
  }

  connect(voiceName: string, resume = false, lang?: string) {
    // A second connect() while a socket exists would leak it and its handlers;
    // detach the old one first.
    if (this.websocket) {
      this.websocket.onopen = null;
      this.websocket.onmessage = null;
      this.websocket.onclose = null;
      this.websocket.onerror = null;
      this.websocket.close();
      this.websocket = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const params = new URLSearchParams();
    params.set("voice_name", voiceName);
    if (resume) params.set("resume", "true");
    if (lang) params.set("lang", lang);
    const wsUrl = `${protocol}//${window.location.host}/ws?${params}`;

    this.websocket = new WebSocket(wsUrl);
    this.websocket.binaryType = "arraybuffer";
    this.websocket.onopen = () => this.onOpen();
    this.websocket.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        try {
          this.onJsonEvent(JSON.parse(event.data));
        } catch (e) {
          console.error("Parse error:", e);
        }
      } else {
        this.onAudio(event.data as ArrayBuffer);
      }
    };
    this.websocket.onclose = (event) => this.onClose(event);
    this.websocket.onerror = (event) => this.onError(event);
  }

  send(data: string | ArrayBuffer) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(data);
    }
  }

  sendText(text: string) {
    this.send(JSON.stringify({ text }));
  }

  sendImage(base64Data: string, mimeType = "image/jpeg") {
    this.send(
      JSON.stringify({
        type: "image",
        mime_type: mimeType,
        data: base64Data,
      }),
    );
  }

  disconnect() {
    if (this.websocket) {
      // detach handlers first: a fast reconnect must not see the stale onclose
      this.websocket.onopen = null;
      this.websocket.onmessage = null;
      this.websocket.onclose = null;
      this.websocket.onerror = null;
      this.websocket.close();
      this.websocket = null;
    }
  }

  isConnected() {
    return this.websocket?.readyState === WebSocket.OPEN;
  }
}
