import { useTranslation } from "react-i18next";
import { Check, WifiOff } from "lucide-react";
import type { useClinicalSession } from "@/hooks/use-clinical-session";
import { Button } from "@/components/ui/button";

type Session = ReturnType<typeof useClinicalSession>;

export function EndedScreen({ session }: { session: Session }) {
  const { t } = useTranslation();
  const { endedLost, endedError, busy, connect, startNew, queueNumber } =
    session;

  return (
    <section
      aria-labelledby="screen-title"
      className="h-full screen-enter grid grid-rows-[auto_minmax(0,1fr)_auto] md:bg-primary-soft md:grid-rows-[minmax(0,1fr)_auto_auto_minmax(0,1fr)]"
    >
      <span aria-hidden className="block" />

      <div className="min-h-0 overflow-y-auto px-5 pt-10 pb-6 text-center md:w-[min(100%-48px,480px)] md:justify-self-center md:overflow-visible md:bg-surface md:rounded-t-rl md:px-8 md:pt-8 md:pb-4">
        <div
          aria-hidden
          className={
            endedLost
              ? "flex items-center justify-center size-[72px] mx-auto mb-5 rounded-full bg-urgent-soft text-urgent-strong"
              : "flex items-center justify-center size-[72px] mx-auto mb-5 rounded-full bg-success-soft text-success"
          }
        >
          {endedLost ? (
            <WifiOff className="size-[34px]" strokeWidth={2.25} />
          ) : (
            <Check className="size-[34px]" strokeWidth={2.25} />
          )}
        </div>
        <h2
          id="screen-title"
          tabIndex={-1}
          className="font-display text-fxl font-bold focus:outline-none"
        >
          {endedLost ? t("lost_t") : t("ended_t")}
        </h2>
        <p className="mt-3 text-ink-2">{endedLost ? t("lost_d") : t("ended_d")}</p>

        {/* queue card: shown once the interview ran to completion */}
        {queueNumber && (
          <div className="mt-6 rounded-m bg-primary-soft px-6 py-5 text-left">
            <p className="text-fxs font-semibold text-primary-strong">
              {t("queue_label")}
            </p>
            <p className="font-display text-[44px] leading-none font-bold text-primary-strong tabular-nums tracking-[0.1em]">
              {queueNumber}
            </p>
            <p className="mt-2 text-fs text-primary-strong">{t("queue_wait")}</p>
          </div>
        )}
      </div>

      <footer className="flex flex-col gap-3 px-5 pt-3 pb-5 md:w-[min(100%-48px,480px)] md:justify-self-center md:bg-surface md:rounded-b-rl md:px-8 md:pt-4 md:pb-8">
        {endedError && (
          <p role="alert" className="banner-error">
            {endedError}
          </p>
        )}
        <Button onClick={() => connect({ resume: true })} disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden />
              {t("connecting")}
            </>
          ) : (
            t("resume")
          )}
        </Button>
        <Button variant="secondary" onClick={startNew} disabled={busy}>
          {t("new")}
        </Button>
      </footer>

      <span aria-hidden className="hidden md:block" />
    </section>
  );
}
