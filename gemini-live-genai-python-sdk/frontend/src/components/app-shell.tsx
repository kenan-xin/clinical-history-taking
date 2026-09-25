import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { Screen } from "@/hooks/use-clinical-session";
import { Badge } from "@/components/ui/badge";
import { LangSwitch } from "@/components/lang-switch";
import { cn } from "@/lib/utils";

/**
 * App shell: plain screen on phones, top bar from tablet (md), step
 * sidebar from desktop (lg) — per the design's responsive contract.
 */
export function AppShell({
  screen,
  visitId,
  children,
}: {
  screen: Screen;
  visitId: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const step = screen === "start" ? 1 : screen === "chat" ? 2 : 3;

  return (
    <div className="h-full grid grid-rows-[minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]">
      <header className="hidden md:flex items-center gap-3 min-h-14 px-5 md:px-6 bg-surface border-b border-line lg:col-span-2">
        <span
          aria-hidden
          className="flex items-center justify-center size-8 rounded-[8px] bg-primary text-on-primary"
        >
          <Plus className="size-5" strokeWidth={1.75} />
        </span>
        <strong className="font-display text-[17px] font-bold mr-auto">
          {t("brand")}
        </strong>
        {visitId && (
          <Badge>
            {t("bar_visit")} <b className="font-bold">{visitId}</b>
          </Badge>
        )}
        <LangSwitch className="p-0.5 [&_[data-slot=toggle-group-item]]:min-h-9 [&_[data-slot=toggle-group-item]]:text-fxs" />
      </header>

      <nav
        aria-label={t("steps_label")}
        className="hidden lg:flex flex-col justify-between gap-6 overflow-y-auto py-6 px-4 bg-surface border-r border-line"
      >
        <div>
          <p className="px-3 text-xs font-bold tracking-[0.06em] uppercase text-ink-2">
            {t("steps_label")}
          </p>
          <ol className="mt-2 grid gap-0.5">
            <Step n={1} label={t("step1")} state={stepOf(1, step)} />
            <Step n={2} label={t("step2")} state={stepOf(2, step)} />
            <Step n={3} label={t("step3")} state={stepOf(3, step)} />
          </ol>
        </div>
        <div className="p-4 rounded-m bg-background text-ink-2 text-fxs">
          <strong className="block mb-0.5 text-foreground text-[15px]">
            {t("p4_t")}
          </strong>
          {t("p4_d")}
        </div>
      </nav>

      <main className="min-h-0 md:overflow-y-auto">{children}</main>
    </div>
  );
}

function stepOf(n: number, current: number): "done" | "current" | "todo" {
  return n < current ? "done" : n === current ? "current" : "todo";
}

function Step({
  n,
  label,
  state,
}: {
  n: number;
  label: string;
  state: "done" | "current" | "todo";
}) {
  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "flex items-center gap-3 min-h-10 px-3 rounded-rs text-[15px] font-semibold",
        state === "todo" && "text-ink-2",
        state === "current" && "bg-primary-soft text-primary-strong",
        state === "done" && "text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center size-6 shrink-0 rounded-full border-[1.5px] text-xs",
          state === "current" && "bg-primary border-primary text-on-primary",
          state === "done" &&
            "bg-success-soft border-success text-success",
        )}
      >
        {n}
      </span>
      {label}
    </li>
  );
}
