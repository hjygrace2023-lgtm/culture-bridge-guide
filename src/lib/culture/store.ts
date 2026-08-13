/**
 * Single source of truth for the globally selected cultural context.
 *
 * One tiny external store, read through `useCultureContext()`. Every surface
 * (home picker, top bar search, Analyse chip, Compose chip) reads and writes
 * here — there is deliberately no second copy of this state anywhere.
 *
 * Wording note: the selected value is *situational context* — a prompt for
 * possible communication tendencies in a setting, never a label that predicts
 * what an individual meant.
 */
import { useCallback, useSyncExternalStore } from "react";
import { REGION_NOTES } from "@/lib/analysis/regions";

const KEY = "culturelens:culture-context";

/** A free-text setting name ("Japan", "a university in Berlin") or null. */
export type CultureContext = string | null;

let value: CultureContext = null;
let loaded = false;
const listeners = new Set<() => void>();

function load(): CultureContext {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    value = load();
    loaded = true;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getCultureContext(): CultureContext {
  ensureLoaded();
  return value;
}

export function setCultureContext(next: CultureContext) {
  const clean = next && next.trim() ? next.trim() : null;
  value = clean;
  loaded = true;
  if (typeof window !== "undefined") {
    try {
      if (clean) window.localStorage.setItem(KEY, clean);
      else window.localStorage.removeItem(KEY);
    } catch {
      /* private mode — state still works for this session */
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      value = load();
      emit();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Shared hook. `culture` is null until hydrated on the client. */
export function useCultureContext() {
  const culture = useSyncExternalStore(
    subscribe,
    () => getCultureContext(),
    () => null,
  );
  const set = useCallback((next: CultureContext) => setCultureContext(next), []);
  const clear = useCallback(() => setCultureContext(null), []);
  return { culture, setCulture: set, clearCulture: clear };
}

/** The hedged tendency note for a selected context, when we have one. */
export function noteForCulture(culture: CultureContext): string | null {
  if (!culture) return null;
  const q = culture.toLowerCase();
  const match = REGION_NOTES.find(
    (r) => q.includes(r.name.toLowerCase()) || r.aliases.some((a) => q.includes(a)),
  );
  return match?.note ?? null;
}
