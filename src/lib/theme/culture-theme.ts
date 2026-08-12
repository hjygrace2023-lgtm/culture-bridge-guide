import { useCallback, useEffect, useState } from "react";

/**
 * Culturally adaptive background patterns (WhatsApp-style: subtle, tiled,
 * low-contrast). Each theme is a tiling SVG rendered with `currentColor`-like
 * tokens baked in as a muted foreground tint, so it sits quietly behind content.
 */

export type CultureThemeId = "neutral" | "east-asia" | "south-asia" | "mena" | "europe" | "west-africa";

export interface CultureTheme {
  id: CultureThemeId;
  label: string;
  /** Regions that map to this pattern set, matched case-insensitively. */
  regions: string[];
  svg: string;
  size: number;
}

const stroke = "%23134e4a";

const THEMES: CultureTheme[] = [
  {
    id: "neutral",
    label: "Neutral",
    regions: [],
    size: 88,
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88' viewBox='0 0 88 88'><g fill='none' stroke='${stroke}' stroke-width='1.4' stroke-linecap='round'><path d='M12 20h16M20 12v16'/><circle cx='64' cy='26' r='7'/><path d='M18 62c6-8 14-8 20 0'/><path d='M58 58h16v16h-16z'/></g></svg>`,
  },
  {
    id: "east-asia",
    label: "East Asia · seigaiha",
    regions: ["japan", "china", "korea", "south korea", "taiwan", "hong kong", "vietnam"],
    size: 80,
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'><g fill='none' stroke='${stroke}' stroke-width='1.3'><path d='M0 40a20 20 0 0 1 40 0M40 40a20 20 0 0 1 40 0'/><path d='M0 40a13 13 0 0 1 26 0M40 40a13 13 0 0 1 26 0' transform='translate(7)'/><path d='M-20 20a20 20 0 0 1 40 0M20 20a20 20 0 0 1 40 0M60 20a20 20 0 0 1 40 0'/></g></svg>`,
  },
  {
    id: "south-asia",
    label: "South Asia · paisley",
    regions: ["india", "pakistan", "bangladesh", "sri lanka", "nepal"],
    size: 96,
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><g fill='none' stroke='${stroke}' stroke-width='1.3'><path d='M24 68c-14-6-10-30 6-32 14-2 20 10 12 18-6 6-16 2-14-6'/><path d='M72 28c14 6 10 30-6 32-14 2-20-10-12-18 6-6 16-2 14 6'/><circle cx='48' cy='48' r='2'/></g></svg>`,
  },
  {
    id: "mena",
    label: "Middle East · geometric",
    regions: ["saudi arabia", "uae", "united arab emirates", "egypt", "morocco", "turkey", "iran", "qatar", "jordan"],
    size: 72,
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'><g fill='none' stroke='${stroke}' stroke-width='1.3'><path d='M36 6l30 30-30 30L6 36z'/><path d='M36 18l18 18-18 18-18-18z'/><path d='M0 0l12 12M72 0L60 12M0 72l12-12M72 72L60 60'/></g></svg>`,
  },
  {
    id: "europe",
    label: "Europe · tiles",
    regions: ["germany", "france", "spain", "italy", "netherlands", "sweden", "poland", "uk", "united kingdom", "portugal"],
    size: 64,
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><g fill='none' stroke='${stroke}' stroke-width='1.3'><rect x='8' y='8' width='48' height='48' rx='6'/><path d='M32 8v48M8 32h48'/><circle cx='32' cy='32' r='6'/></g></svg>`,
  },
  {
    id: "west-africa",
    label: "West Africa · woven",
    regions: ["nigeria", "ghana", "senegal", "kenya", "south africa", "ethiopia"],
    size: 60,
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='${stroke}' stroke-width='1.4'><path d='M0 15h60M0 45h60'/><path d='M10 0v60M40 0v60'/><path d='M15 22l8 8-8 8M45 22l-8 8 8 8'/></g></svg>`,
  },
];

export const CULTURE_THEMES = THEMES;

const STORAGE_KEY = "culturelens.pattern";

export function getTheme(id: CultureThemeId): CultureTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

/** Maps a free-text region/locale string to the closest pattern set. */
export function themeForRegion(region: string | undefined | null): CultureThemeId {
  if (!region) return "neutral";
  const value = region.toLowerCase();
  const match = THEMES.find((t) => t.regions.some((r) => value.includes(r)));
  return match?.id ?? "neutral";
}

export function backgroundImageFor(id: CultureThemeId): string {
  const theme = getTheme(id);
  return `url("data:image/svg+xml,${theme.svg.replace(/\n/g, "").replace(/"/g, "'").replace(/#/g, "%23")}")`;
}

export function setStoredTheme(id: CultureThemeId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent("culturelens:pattern", { detail: id }));
}

export function useCultureTheme() {
  const [id, setId] = useState<CultureThemeId>("neutral");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CultureThemeId | null;
    if (stored) setId(stored);
    const onChange = (event: Event) => setId((event as CustomEvent<CultureThemeId>).detail);
    window.addEventListener("culturelens:pattern", onChange);
    return () => window.removeEventListener("culturelens:pattern", onChange);
  }, []);

  const select = useCallback((next: CultureThemeId) => {
    setId(next);
    setStoredTheme(next);
  }, []);

  return { id, theme: getTheme(id), select };
}
