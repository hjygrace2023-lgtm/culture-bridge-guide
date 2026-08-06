import { useCallback, useEffect, useState } from "react";
import type { Analysis, SavedScenario, SituationInput } from "./types";
import { RELATIONSHIP_LABEL } from "./types";

const SAVED_KEY = "culturelens:saved";
const CURRENT_KEY = "culturelens:current";
const DRAFT_KEY = "culturelens:draft";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable in private mode — the app still works */
  }
}

/* ------------------------------------------------- current analysis + draft */

export const setCurrentAnalysis = (analysis: Analysis) => write(CURRENT_KEY, analysis);
export const getCurrentAnalysis = () => read<Analysis | null>(CURRENT_KEY, null);

export const setDraftInput = (input: SituationInput) => write(DRAFT_KEY, input);
export const getDraftInput = () => read<SituationInput | null>(DRAFT_KEY, null);
export const clearDraftInput = () => {
  if (isBrowser()) window.localStorage.removeItem(DRAFT_KEY);
};

/* ------------------------------------------------------------ saved list */

export function toSavedScenario(analysis: Analysis): SavedScenario {
  return {
    id: analysis.id,
    savedAt: new Date().toISOString(),
    title: analysis.title,
    setting: [
      analysis.input.relationship ? RELATIONSHIP_LABEL[analysis.input.relationship] : null,
      analysis.input.socialContext?.trim() || null,
    ]
      .filter(Boolean)
      .join(" · ") || "Setting not specified",
    mainGap: analysis.gapFactors[0]?.tag ?? "Communication gap",
    strategy: analysis.strategy.name,
    analysis,
  };
}

export function useSavedScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setScenarios(read<SavedScenario[]>(SAVED_KEY, []));
    setHydrated(true);
  }, []);

  const save = useCallback((analysis: Analysis) => {
    setScenarios((prev) => {
      const entry = toSavedScenario(analysis);
      const next = [entry, ...prev.filter((s) => s.id !== entry.id)];
      write(SAVED_KEY, next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      write(SAVED_KEY, next);
      return next;
    });
  }, []);

  return { scenarios, hydrated, save, remove };
}
