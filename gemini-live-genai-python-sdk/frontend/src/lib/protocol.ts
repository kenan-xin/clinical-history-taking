/**
 * Wire protocol with the FastAPI backend (/ws), unchanged from the vanilla app.
 *
 * Client → server:
 *  - binary ArrayBuffer: 16 kHz PCM16 microphone audio
 *  - {"text": "..."}                          — text message
 *  - {"type":"image","mime_type","data"}      — base64 JPEG camera/screen frame
 *
 * Server → client:
 *  - binary ArrayBuffer: 24 kHz PCM16 response audio
 *  - JSON events: see ServerEvent below
 */

export type UserTranscriptionEvent = { type: "user"; text: string };
export type GeminiTranscriptionEvent = { type: "gemini"; text: string };
export type TurnCompleteEvent = { type: "turn_complete" };
export type InterruptedEvent = { type: "interrupted" };
export type ToolCallEvent = {
  type: "tool_call";
  name: string;
  args: Record<string, unknown>;
  result: unknown;
};
export type ErrorEvent = { type: "error"; error: string };

export type ServerEvent =
  | UserTranscriptionEvent
  | GeminiTranscriptionEvent
  | TurnCompleteEvent
  | InterruptedEvent
  | ToolCallEvent
  | ErrorEvent;

export function isServerEvent(value: unknown): value is ServerEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
