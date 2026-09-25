import { useTranslation } from "react-i18next";
import { changeLang, LANGS } from "@/i18n";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function LangSwitch({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <ToggleGroup
      type="single"
      value={i18n.language}
      onValueChange={(v) => v && changeLang(v)}
      aria-label={t("lang_label")}
      className={className}
    >
      {LANGS.map((l) => (
        <ToggleGroupItem key={l.code} value={l.code} lang={l.htmlLang}>
          {l.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function LangSelect({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <Select value={i18n.language} onValueChange={changeLang}>
      <SelectTrigger
        aria-label={t("lang_label")}
        className={cn(
          "w-auto min-h-11 max-w-[120px] rounded-full border-[1.5px] px-3 py-0 gap-1.5 text-[15px] font-semibold",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code} lang={l.htmlLang}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
