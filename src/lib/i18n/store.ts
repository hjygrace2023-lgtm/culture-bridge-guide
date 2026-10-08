import { useCallback, useEffect, useSyncExternalStore } from "react";
import { DICT } from "./dict";

/**
 * Lightweight UI translation. English source strings are the keys;
 * `t("Some text")` returns the active locale's version or falls back to English.
 */
export type Locale = "en" | "ja" | "zh" | "es" | "fr";

export const LOCALES: { code: Locale; label: string; aiName: string }[] = [
  { code: "en", label: "English", aiName: "British English" },
  { code: "ja", label: "日本語", aiName: "Japanese" },
  { code: "zh", label: "中文", aiName: "Simplified Chinese" },
  { code: "es", label: "Español", aiName: "Spanish" },
  { code: "fr", label: "Français", aiName: "French" },
];

const KEY = "culturelens:locale";
const INDEX: Record<Exclude<Locale, "en">, number> = { ja: 0, zh: 1, es: 2, fr: 3 };
const listeners = new Set<() => void>();
let current: Locale = "en";
let loaded = false;

function isLocale(v: unknown): v is Locale {
  return LOCALES.some((l) => l.code === v);
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const stored = window.localStorage.getItem(KEY);
  if (isLocale(stored)) current = stored;
  else {
    const nav = window.navigator.language.slice(0, 2);
    if (isLocale(nav)) current = nav;
  }
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && isLocale(e.newValue)) {
      current = e.newValue;
      listeners.forEach((l) => l());
    }
  });
}

export function setLocale(locale: Locale) {
  current = locale;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, locale);
  listeners.forEach((l) => l());
}

export function getLocale(): Locale {
  load();
  return current;
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  // Notify once after hydration so a stored locale applies.
  cb();
  return () => listeners.delete(cb);
}

export function translate(locale: Locale, text: string): string {
  if (locale === "en") return text;
  return DICT[text]?.[INDEX[locale]] ?? text;
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getLocale, () => "en" as Locale);
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hans" : locale;
  }, [locale]);
  const t = useCallback((text: string) => translate(locale, text), [locale]);
  return { locale, setLocale, t };
}

export function aiLanguageName(locale: Locale): string {
  return LOCALES.find((l) => l.code === locale)?.aiName ?? "British English";
}
