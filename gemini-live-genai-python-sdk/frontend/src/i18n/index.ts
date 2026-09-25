import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, ms, ta, zh } from "./resources";

export const LANGS = [
  { code: "en", label: "English", htmlLang: "en" },
  { code: "zh", label: "中文", htmlLang: "zh-Hans" },
  { code: "ms", label: "Melayu", htmlLang: "ms" },
  { code: "ta", label: "தமிழ்", htmlLang: "ta" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  ms: { translation: ms },
  ta: { translation: ta },
};

function initialLang(): LangCode {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  const fromStorage = window.localStorage.getItem("lang");
  const candidate = fromUrl ?? fromStorage;
  if (candidate && candidate in resources) return candidate as LangCode;
  return "en";
}

const htmlLangByCode = Object.fromEntries(
  LANGS.map((l) => [l.code, l.htmlLang]),
) as Record<LangCode, string>;

export function applyDocumentLang(code: LangCode) {
  document.documentElement.lang = htmlLangByCode[code] ?? "en";
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// persist the resolved language, like the design (a ?lang= link sticks)
window.localStorage.setItem("lang", i18n.language);

applyDocumentLang(i18n.language as LangCode);

export function changeLang(code: string) {
  if (!(code in resources)) return;
  i18n.changeLanguage(code);
  window.localStorage.setItem("lang", code);
  applyDocumentLang(code as LangCode);
}

export { i18n };
export default i18n;
