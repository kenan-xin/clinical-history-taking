import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Mic, UserRound, Video } from "lucide-react";
import type { useClinicalSession } from "@/hooks/use-clinical-session";
import { isValidVisitId } from "@/hooks/use-clinical-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VOICES } from "@/hooks/use-clinical-session";
import { LangSwitch } from "@/components/lang-switch";

type Session = ReturnType<typeof useClinicalSession>;

const POINTS = [
  { icon: Mic, titleKey: "p1_t", descKey: "p1_d" },
  { icon: Globe, titleKey: "p2_t", descKey: "p2_d" },
  { icon: Video, titleKey: "p3_t", descKey: "p3_d" },
  { icon: UserRound, titleKey: "p4_t", descKey: "p4_d" },
];

export function StartScreen({ session }: { session: Session }) {
  const { t } = useTranslation();
  const {
    visitId,
    voice,
    setVoice,
    restart,
    setRestart,
    busy,
    startError,
    connect,
  } = session;

  const visitKnown = visitId !== "";
  const [visitInput, setVisitInput] = useState(visitId);
  const [visitErr, setVisitErr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkVisit = () => {
    const v = visitInput.trim();
    const ok = isValidVisitId(v);
    setVisitErr(!ok);
    return ok ? v : "";
  };

  const start = async () => {
    if (!visitKnown) {
      const v = checkVisit();
      if (!v) {
        inputRef.current?.focus();
        return;
      }
      await connect({ visitId: v });
    } else {
      await connect();
    }
  };

  return (
    <section
      aria-labelledby="screen-title"
      className="h-full screen-enter grid grid-rows-[auto_minmax(0,1fr)_auto] md:relative md:h-auto md:w-[min(100%-48px,1040px)] md:mx-auto md:my-6 md:grid-cols-2 md:grid-rows-[auto_auto_auto_auto] md:bg-surface md:border md:border-line md:rounded-rl md:shadow-app md:overflow-hidden lg:my-10"
    >
      <div
        aria-hidden
        className="hidden md:block md:col-start-1 md:row-start-1 md:row-end-5 md:bg-primary-soft"
      />

      {/* head */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 md:col-start-1 md:row-start-1 md:px-8 lg:px-10 md:pt-8">
        <p className="text-fxs font-semibold text-primary-strong tracking-[0.02em]">
          {t("eyebrow")}
        </p>
        <LangSwitch className="md:hidden" />
      </header>

      {/* body (scrolls on phones) */}
      <div className="min-h-0 overflow-y-auto px-5 pt-4 pb-6 md:contents">
        <h1
          id="screen-title"
          tabIndex={-1}
          className="font-display font-bold text-[clamp(26px,7.5vw,32px)] leading-[1.15] focus:outline-none md:col-start-1 md:row-start-2 md:px-8 lg:px-10 md:pt-3 md:text-[clamp(28px,3.4vw,36px)]"
        >
          {t("start_title")}
        </h1>
        <p className="mt-3 text-ink-2 md:col-start-1 md:row-start-3 md:px-8 lg:px-10 md:mt-3">
          {t("lead")}
        </p>

        {visitKnown ? (
          <div className="mt-6 p-4 px-5 bg-surface border border-line rounded-m shadow-app md:col-start-2 md:row-start-1 md:row-end-3 md:self-end md:my-8 md:mx-8 lg:mx-10 md:mt-8 md:mb-0 md:shadow-none">
            <div className="grid gap-1.5">
              <span className="text-fxs text-ink-2">{t("your_visit")}</span>
              <span className="font-display text-fl font-bold leading-[1.3] break-words">
                {visitId}
              </span>
            </div>
            <Button
              variant="link"
              className="mx-[-8px] mt-1 mb-[-8px]"
              onClick={() => {
                setVisitInput(visitId);
                session.setVisitId("");
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              {t("not_my_visit")}
            </Button>
          </div>
        ) : (
          <div className="mt-6 p-4 px-5 bg-surface border border-line rounded-m shadow-app flex flex-col gap-1.5 md:col-start-2 md:row-start-1 md:row-end-3 md:self-end md:my-8 md:mx-8 lg:mx-10 md:mt-8 md:mb-0 md:shadow-none">
            <label
              htmlFor="visit-input"
              className="font-semibold text-fs [&_.muted]:font-normal"
              dangerouslySetInnerHTML={{ __html: t("visit_label_html") }}
            />
            <Input
              id="visit-input"
              ref={inputRef}
              value={visitInput}
              onChange={(e) => setVisitInput(e.target.value)}
              onBlur={() => {
                if (visitInput) checkVisit();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") start();
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="V-2026-07-17-0031"
              aria-describedby="visit-help visit-err"
              aria-invalid={visitErr}
            />
            <span id="visit-help" className="text-fxs text-ink-2">
              {t("visit_help")}
            </span>
            <span id="visit-err" hidden={!visitErr} className="text-fxs font-semibold text-urgent-strong">
              {t("visit_err")}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 md:col-start-1 md:row-start-4 md:px-8 lg:px-10 md:mt-6 md:pb-8">
          {POINTS.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex items-center justify-center size-10 shrink-0 rounded-rs bg-primary-soft text-primary-strong md:bg-surface"
              >
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <strong className="block text-fm">{t(titleKey)}</strong>
                <span className="block text-ink-2 text-fs">{t(descKey)}</span>
              </div>
            </div>
          ))}
        </div>

        <Collapsible className="mt-6 border-t border-line pt-2 md:col-start-2 md:row-start-3 md:mx-8 lg:mx-10 md:mt-4">
          <CollapsibleTrigger>{t("more_options")}</CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-4 py-2 data-[state=closed]:hidden">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="voice" className="font-semibold text-fs">
                {t("voice_label")}
              </label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger id="voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={restart}
                onCheckedChange={(v) => setRestart(v === true)}
              />
              <span>
                <strong className="block font-semibold text-fs">
                  {t("restart_t")}
                </strong>
                <span className="block text-ink-2 text-fxs">{t("restart_d")}</span>
              </span>
            </label>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* footer */}
      <footer className="flex flex-col gap-3 px-5 pt-3 pb-5 md:col-start-2 md:row-start-4 md:self-start md:px-8 lg:px-10 md:pt-5 md:pb-8">
        {startError && (
          <p role="alert" className="banner-error">
            {startError}
          </p>
        )}
        <Button onClick={start} disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden />
              {t("connecting")}
            </>
          ) : (
            t("start")
          )}
        </Button>
      </footer>
    </section>
  );
}
