import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { REGION_NOTES, searchRegions } from "@/lib/analysis/regions";
import { noteForCulture, useCultureContext } from "@/lib/culture/store";
import { cn } from "@/lib/utils";

/**
 * The central homepage control for the shared cultural context.
 * Writes to the one shared store; every other surface reads from it.
 */
export function CulturePicker() {
  const { culture, setCulture, clearCulture } = useCultureContext();
  const [query, setQuery] = useState("");

  const results = useMemo(() => (query.trim() ? searchRegions(query) : REGION_NOTES.slice(0, 8)), [query]);
  const note = noteForCulture(culture);

  return (
    <section className="border-2 border-foreground bg-card">
      <div className="flex items-baseline gap-3 border-b-2 border-foreground px-5 py-4 sm:px-6">
        <span className="token-circle h-7 w-7 bg-lime text-xs">1</span>
        <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
          Which setting is this about?
        </h2>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Optional. This describes the situation, not the person — it only suggests communication tendencies that are
          sometimes reported in a setting.
        </p>

        <div className="relative mt-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                setCulture(query.trim());
                setQuery("");
              }
            }}
            placeholder="Type any country, region or setting"
            aria-label="Search a country, region or setting"
            className="h-14 w-full border-0 border-b-2 border-foreground bg-transparent pr-10 font-display text-xl font-bold tracking-tight outline-none placeholder:text-foreground/35 sm:text-2xl"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search field"
              className="absolute right-0 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-foreground/60 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {results.map((r) => {
            const active = culture === r.name;
            return (
              <button
                key={r.name}
                type="button"
                onClick={() => {
                  setCulture(active ? null : r.name);
                  setQuery("");
                }}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 border-2 border-foreground px-3.5 text-xs font-bold transition-colors",
                  active ? "bg-foreground text-background" : "bg-background hover:bg-yellow",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("h-2 w-2 rounded-full", active ? "bg-yellow" : "bg-foreground/30")}
                />
                {r.name}
              </button>
            );
          })}
          {query.trim() && !results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={() => {
                setCulture(query.trim());
                setQuery("");
              }}
              className="inline-flex min-h-10 items-center border-2 border-dashed border-foreground px-3.5 text-xs font-bold"
            >
              Use “{query.trim()}” →
            </button>
          )}
        </div>
      </div>

      {culture && (
        <div className="animate-rise border-t-2 border-foreground bg-yellow px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-lg font-extrabold tracking-tight">{culture}</p>
            <button
              type="button"
              onClick={clearCulture}
              className="shrink-0 border-2 border-foreground px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-background"
            >
              Clear
            </button>
          </div>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-foreground/75">
            {note ??
              "No reference notes for this setting yet — it will still be carried into Analyse and Compose as background."}
          </p>
        </div>
      )}
    </section>
  );
}
