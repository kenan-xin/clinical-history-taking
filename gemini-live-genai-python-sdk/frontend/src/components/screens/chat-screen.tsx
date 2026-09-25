import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUp,
  Mic,
  MicOff,
  MonitorUp,
  Keyboard,
  TriangleAlert,
  Video,
} from "lucide-react";
import type { useClinicalSession } from "@/hooks/use-clinical-session";
import type { ChatItem } from "@/hooks/use-clinical-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { LangSelect } from "@/components/lang-switch";
import { cn } from "@/lib/utils";

type Session = ReturnType<typeof useClinicalSession>;

export function ChatScreen({ session }: { session: Session }) {
  const { t } = useTranslation();
  const {
    items,
    thinking,
    speaking,
    mic,
    video,
    composerOpen,
    setComposerOpen,
    toggleMic,
    toggleCamera,
    toggleScreen,
    sendTyped,
    endSession,
    videoRef,
    showScreenShare,
  } = session;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (!sendTyped(text)) return; // offline: keep the draft so nothing is lost
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "";
  };

  const grow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const speakingNow = speaking;

  return (
    <section
      aria-labelledby="screen-title"
      className="h-full screen-enter grid grid-rows-[auto_minmax(0,1fr)_auto] md:grid-cols-[300px_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_minmax(0,1fr)_auto]"
    >
      {/* header */}
      <header className="flex items-center gap-3 bg-surface border-b border-line py-2 pl-5 pr-3 md:col-span-2 md:px-6 md:py-3">
        <div className="flex-1 min-w-0">
          <strong
            id="screen-title"
            tabIndex={-1}
            className="block font-display text-fm font-semibold focus:outline-none"
          >
            {t("chat_title")}
          </strong>
          <span className="flex items-center gap-1.5 text-fxs text-ink-2">
            <i aria-hidden className="size-2 rounded-full bg-success" />
            {t("connected")}
          </span>
        </div>
        <LangSelect className="md:hidden" />
        <Button variant="pill" size="pill" onClick={() => setConfirmOpen(true)}>
          {t("end")}
        </Button>
      </header>

      {/* transcript */}
      <MessageList items={items} thinking={thinking} />

      {/* footer stack on phones / split panes from tablet */}
      <div className="flex flex-col gap-3 px-4 py-3 bg-surface border-t border-line md:contents">
        {/* session panel */}
        <div className="md:flex md:flex-col md:gap-4 md:p-5 md:bg-surface md:border-r md:border-line md:overflow-y-auto md:col-start-1 md:row-start-2 md:[grid-row:2/-1] lg:col-start-2 lg:row-start-2 lg:[grid-row:2/3] lg:border-r-0 lg:border-l">
          {/* state line */}
          <p
            aria-live="polite"
            className={cn(
              "order-1 flex items-center justify-center gap-2 min-h-7 font-display font-semibold text-fs text-center",
              "md:justify-start md:min-h-[52px] md:px-4 md:py-3 md:rounded-m md:bg-background md:text-left",
              mic === "blocked" && "text-urgent-strong",
            )}
          >
            {(speakingNow || (mic === "on" && !thinking)) && (
              <span aria-hidden className="inline-flex items-center gap-[3px] h-[18px]">
                {[0, 120, 240].map((delay) => (
                  <i
                    key={delay}
                    className="w-1 h-full rounded-[2px] bg-primary level-bar"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            )}
            <span>
              {mic === "blocked"
                ? t("st_blocked")
                : speakingNow
                  ? t("st_speaking")
                  : thinking
                    ? t("thinking")
                    : mic === "on"
                      ? t("st_listening")
                      : t("st_off")}
            </span>
          </p>

          {/* camera preview: the element stays mounted so the stream can always attach */}
          <div
            className={cn(
              "order-2 relative rounded-m overflow-hidden bg-cam",
              !video && "hidden",
            )}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              data-cam-video className="block w-full aspect-[4/3] max-h-[200px] object-contain bg-cam"
            />
            <p className="px-3 py-2 bg-primary-soft text-primary-strong text-fxs font-semibold">
              {video === "screen" ? t("sees_screen") : t("sees_cam")}
            </p>
          </div>

          {/* visit info (tablet+) */}
          <div className="hidden md:grid gap-0.5 p-4 border border-line rounded-m">
            <span className="text-fxs text-ink-2">{t("your_visit")}</span>
            <strong className="font-display text-lg break-words">
              {session.visitId || "—"}
            </strong>
            <span className="text-fxs text-ink-2">{t("panel_note")}</span>
          </div>
        </div>

        {/* controls */}
        <div className="order-4 flex justify-center items-start gap-6 md:order-none md:col-start-2 md:row-start-3 md:justify-self-center md:items-center md:gap-2 md:my-2 md:mb-4 md:p-2 md:bg-surface md:border md:border-line md:rounded-full md:shadow-float lg:col-start-2 lg:row-start-3 lg:justify-self-stretch lg:justify-around lg:my-0 lg:px-4 lg:py-2 lg:border-0 lg:border-t lg:border-l lg:border-line lg:rounded-none lg:shadow-none">
          <ControlButton
            icon={<Video className="size-6 lg:size-5" strokeWidth={1.75} />}
            label={video === "camera" ? t("cam_on") : t("cam")}
            pressed={video === "camera"}
            onClick={toggleCamera}
          />
          <ControlButton
            mic
            icon={
              mic === "on" ? (
                <Mic className="size-[30px] md:size-6 lg:size-5" strokeWidth={1.75} />
              ) : (
                <MicOff className="size-[30px] md:size-6 lg:size-5" strokeWidth={1.75} />
              )
            }
            label={mic === "on" ? t("mic_on") : t("mic_off")}
            ariaLabel={mic === "on" ? t("mic_turn_off") : t("mic_turn_on")}
            pressed={mic === "on"}
            live={mic === "on" && !speakingNow && !thinking}
            onClick={toggleMic}
          />
          <ControlButton
            className="lg:hidden"
            icon={<Keyboard className="size-6 lg:size-5" strokeWidth={1.75} />}
            label={t("type")}
            pressed={composerOpen}
            ariaControls={composerOpen ? "composer" : undefined}
            onClick={() => setComposerOpen(!composerOpen)}
          />
          {showScreenShare && (
            <ControlButton
              icon={<MonitorUp className="size-6 lg:size-5" strokeWidth={1.75} />}
              label={t("screen")}
              pressed={video === "screen"}
              onClick={toggleScreen}
            />
          )}
        </div>

        {/* composer: always available on desktop; phones/tablets toggle it */}
        <form
          id="composer"
          onSubmit={submit}
          className={cn(
            "order-3 flex items-center gap-2 md:order-none md:col-start-2 md:row-start-4 md:p-3 md:px-6 md:pb-4 md:bg-surface md:border-t md:border-line lg:col-start-1 lg:row-start-3 lg:flex-wrap lg:py-3 lg:px-[max(24px,calc((100%-760px)/2))]",
            !composerOpen && "hidden lg:flex",
          )}
        >
            <button
              type="button"
              aria-pressed={mic === "on"}
              aria-label={mic === "on" ? t("mic_turn_off") : t("mic_turn_on")}
              onClick={toggleMic}
              className={cn(
                "hidden lg:flex size-10 shrink-0 items-center justify-center rounded-rs border border-line bg-surface text-foreground transition-colors hover:border-primary",
                mic === "on" && "bg-primary border-primary text-on-primary",
              )}
            >
              {mic === "on" ? (
                <Mic className="size-5" strokeWidth={1.75} />
              ) : (
                <MicOff className="size-5" strokeWidth={1.75} />
              )}
            </button>
            <Textarea
              ref={textareaRef}
              rows={1}
              enterKeyHint="send"
              value={draft}
              placeholder={t("type_ph")}
              aria-label={t("type_ph")}
              onChange={(e) => {
                setDraft(e.target.value);
                grow();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(e);
                }
              }}
              className="flex-1 lg:min-h-10 lg:rounded-rs lg:px-3 lg:py-[9px]"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label={t("send")}
              className="flex items-center justify-center size-12 shrink-0 rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-strong disabled:bg-disabled-bg disabled:text-disabled-ink disabled:cursor-not-allowed lg:size-10 lg:rounded-rs"
            >
              <ArrowUp className="size-6 lg:size-5" strokeWidth={1.75} />
            </button>
            <p
              className="hidden basis-full text-ink-2 text-[13px] [@media(pointer:fine)_and_(min-width:64rem)]:block"
              dangerouslySetInnerHTML={{ __html: t("kbd_html") }}
            />
        </form>
      </div>

      {/* end confirmation: bottom sheet on phones, centred dialog on tablet+ */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            // the design focuses the title, not the destructive button
            e.preventDefault();
            document.getElementById("confirm-title")?.focus();
          }}
        >
          <DialogTitle id="confirm-title" tabIndex={-1}>
            {t("confirm_title")}
          </DialogTitle>
          <DialogDescription>{t("confirm_text")}</DialogDescription>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="danger"
              onClick={() => {
                setConfirmOpen(false);
                endSession();
              }}
            >
              {t("confirm_end")}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              {t("confirm_keep")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MessageList({
  items,
  thinking,
}: {
  items: ChatItem[];
  thinking: boolean;
}) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<number | null>(null);
  const wasThinkingRef = useRef(false);
  const reducedMotion = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const nearBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const toBottom = (force: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    if (force || nearBottom()) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: reducedMotion.current ? "auto" : "smooth",
      });
    }
  };

  useEffect(() => {
    // force-scroll on a new bubble or the thinking indicator appearing;
    // streamed deltas into an existing bubble only follow when already near the bottom
    const lastId = items[items.length - 1]?.id ?? null;
    const isNewBubble = lastId !== lastIdRef.current;
    lastIdRef.current = lastId;
    toBottom(isNewBubble || (thinking && !wasThinkingRef.current));
    wasThinkingRef.current = thinking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, thinking]);

  useEffect(() => {
    const onFit = () => toBottom(true);
    window.addEventListener("app:viewport-fit", onFit);
    return () => window.removeEventListener("app:viewport-fit", onFit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 overflow-y-auto overscroll-contain flex flex-col md:col-start-2 md:row-start-2 lg:col-start-1"
    >
      <div
        role="log"
        aria-live="polite"
        aria-label={t("chat_title")}
        className="flex-1 flex flex-col gap-3 p-4 md:max-w-[720px] md:w-full md:mx-auto md:p-6 lg:max-w-[760px] lg:gap-4"
      >
        {items.length === 0 && !thinking && (
          <p className="m-auto p-8 px-6 text-center text-ink-2">{t("empty")}</p>
        )}
        {items.map((item) =>
          item.kind === "note" ? (
            <div
              key={item.id}
              className="bubble-in self-stretch flex items-start gap-2 px-4 py-3 rounded-rl bg-urgent-soft text-urgent-strong text-fs"
            >
              <TriangleAlert aria-hidden className="size-5 shrink-0 mt-0.5" />
              <span>{item.text}</span>
            </div>
          ) : (
            <div
              key={item.id}
              className={cn(
                "bubble-in max-w-[86%] px-4 py-3 rounded-rl text-fm leading-normal whitespace-pre-wrap break-words",
                item.kind === "user"
                  ? "self-end bg-primary text-on-primary rounded-br-[6px] lg:bg-primary-soft lg:text-foreground lg:rounded-br-m"
                  : "self-start bg-surface border border-line rounded-bl-[6px] lg:bg-transparent lg:border-0 lg:px-0 lg:rounded-bl-m",
                "lg:max-w-none lg:self-stretch lg:rounded-m",
              )}
            >
              <span
                className={cn(
                  "hidden lg:block mb-0.5 text-[13px] font-semibold text-ink-2",
                  item.kind === "user" && "lg:text-primary-strong",
                )}
              >
                {t(item.kind === "user" ? "who_you" : "who_bot")}
                {"  ·  "}
                {new Date(item.time).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              {item.text}
            </div>
          ),
        )}
        {thinking && (
          <div className="bubble-in self-start flex items-center gap-3 px-4 py-3 rounded-rl rounded-bl-[6px] bg-surface border border-line text-ink-2 text-fs lg:bg-transparent lg:border-0 lg:px-0 lg:rounded-bl-m lg:rounded-m">
            <span aria-hidden className="inline-flex gap-[5px]">
              {[0, 150, 300].map((delay) => (
                <i
                  key={delay}
                  className="size-2 rounded-full bg-ink-2 dot-anim"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            <span>{t("thinking")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlButton({
  icon,
  label,
  pressed,
  onClick,
  mic = false,
  live = false,
  className,
  ariaLabel,
  ariaControls,
}: {
  icon: React.ReactNode;
  label: string;
  pressed: boolean;
  onClick: () => void;
  mic?: boolean;
  live?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaControls?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      onClick={onClick}
      className={cn(
        "grid justify-items-center gap-1.5 min-w-16 border-0 bg-transparent p-0 text-fxs font-semibold text-foreground",
        "md:flex md:flex-row md:items-center md:gap-2 md:min-w-0 md:min-h-12 md:pl-1 md:pr-4 md:rounded-full",
        "lg:flex-col lg:gap-1 lg:min-h-0 lg:min-w-0 lg:px-2 lg:py-1 lg:rounded-rs",
        pressed && "md:bg-primary-soft lg:bg-primary-soft",
        className,
      )}
    >
      <span
        data-ctl-icon={mic ? "mic" : ""}
        className={cn(
          "flex items-center justify-center size-14 rounded-full border-[1.5px] border-line bg-surface text-foreground transition-colors md:size-10 md:border-0 md:bg-primary-soft md:text-primary-strong lg:size-9",
          pressed && "bg-primary-soft border-primary text-primary-strong md:bg-primary-soft",
          mic &&
            "size-[72px] border-0 bg-primary text-on-primary md:size-10 lg:size-9",
          mic &&
            !pressed &&
            "bg-surface text-foreground border-[1.5px] border-ink-2 md:border-0 md:bg-background md:text-foreground",
          mic && pressed && live && "shadow-[0_0_0_8px_var(--primary-soft)]",
        )}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
