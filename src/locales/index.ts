import en from "./en";
import zhTW from "./zh-TW";
import zhCN from "./zh-CN";
import ja from "./ja";
import ko from "./ko";
import es from "./es";
import fr from "./fr";
import de from "./de";
import ptBR from "./pt-BR";

export const messages = {
  en,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  ja,
  ko,
  es,
  fr,
  de,
  "pt-BR": ptBR,
} as const;
export type Locale = keyof typeof messages;
export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português",
};
export function localeParity() {
  const keys = Object.keys(messages.en).sort().join("|");
  return Object.entries(messages).every(
    ([, value]) => Object.keys(value).sort().join("|") === keys,
  );
}
