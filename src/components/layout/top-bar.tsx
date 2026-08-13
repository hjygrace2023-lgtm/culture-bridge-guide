import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Search, X } from "lucide-react";
import { searchRegions } from "@/lib/analysis/regions";
import { useCultureContext } from "@/lib/culture/store";
import { Button } from "@/components/ui/button";

/**
 * Compact secondary control for the shared cultural context.
 * It writes to the same store as the homepage picker — never a one-off search param.
 */
export function TopBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { culture, setCulture } = useCultureContext();

  const results = useMemo(() => searchRegions(query), [query]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0 font-display text-lg font-semibold tracking-tight">
          Culture<span className="text-primary">Lens</span>
        </Link>

        <div ref={wrapRef} className="relative ml-auto w-full max-w-[13rem] sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                setCulture(query.trim());
                setQuery("");
                setOpen(false);
              }
            }}
            placeholder={culture ? `Context: ${culture}` : "Set a context"}
            aria-label="Set the cultural context"
            className="h-10 w-full truncate rounded-full border border-input bg-card pl-9 pr-9 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {open && query.trim() !== "" && (
            <div className="animate-rise absolute right-0 top-12 w-[min(92vw,26rem)] card-surface overflow-hidden p-1.5">
              {results.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No notes for “{query.trim()}” yet — you can still use it as your context.
                </p>
              ) : (
                <ul className="max-h-80 space-y-1 overflow-y-auto">
                  {results.map((region) => (
                    <li key={region.name} className="rounded-xl p-3 transition-colors hover:bg-muted/70">
                      <p className="text-sm font-semibold">{region.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{region.note}</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2 min-h-9 rounded-full text-xs"
                        onClick={() => {
                          setCulture(region.name);
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        {culture === region.name ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" /> Current context
                          </>
                        ) : (
                          "Use as my context"
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => {
                  setCulture(query.trim());
                  setOpen(false);
                  setQuery("");
                }}
                className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-primary hover:bg-muted/70"
              >
                Use “{query.trim()}” as my context
              </button>
              <p className="px-3 pb-2 pt-2 text-[11px] leading-relaxed text-muted-foreground">
                These are tendencies reported in some settings, not descriptions of people. They cannot tell you what
                one individual meant.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
