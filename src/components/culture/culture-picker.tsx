import { useMemo, useState } from "react";
import { Check, Globe2, Search, X } from "lucide-react";
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
    <div className="card-surface p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Which setting is this about?</h2>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Optional. This describes the situation, not the person — it only suggests communication tendencies that are
        sometimes reported in a setting.
      </p>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              setCulture(query.trim());
              setQuery("");
            }
          }}
          placeholder="Search or type any country, region or setting"
          aria-label="Search a country, region or setting"
          className="h-12 w-full rounded-full border border-input bg-background pl-9 pr-9 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search field"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
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
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
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
            className="inline-flex min-h-9 items-center rounded-full border border-dashed border-primary/60 px-3.5 py-2 text-xs font-medium text-primary"
          >
            Use “{query.trim()}”
          </button>
        )}
      </div>

      {culture && (
        <div className="animate-rise mt-4 rounded-2xl bg-muted/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">Context: {culture}</p>
            <button
              type="button"
              onClick={clearCulture}
              className="shrink-0 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {note ??
              "No reference notes for this setting yet — it will still be carried into Analyse and Compose as background."}
          </p>
        </div>
      )}
    </div>
  );
}
