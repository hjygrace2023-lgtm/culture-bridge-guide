import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { searchRegions } from "@/lib/analysis/regions";
import { useCultureContext } from "@/lib/culture/store";

/**
 * Restrained poster header: wordmark, a thick ink rule, and a minimal
 * underlined context field. It writes to the same shared culture store.
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
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3 sm:px-8">
        <Link
          to="/"
          className="shrink-0 font-display text-base font-extrabold uppercase tracking-[-0.02em] leading-none"
        >
          Culture
          <span className="ml-1 inline-flex h-6 items-center bg-foreground px-1.5 text-background">Lens</span>
        </Link>

        <div ref={wrapRef} className="relative ml-auto w-full max-w-[13rem] sm:max-w-xs">
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
            className="h-9 w-full truncate border-0 border-b-2 border-foreground bg-transparent pr-7 text-sm font-medium outline-none placeholder:text-foreground/45 focus:border-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {open && query.trim() !== "" && (
            <div className="animate-rise absolute right-0 top-11 w-[min(92vw,26rem)] border-2 border-foreground bg-card">
              {results.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">
                  No notes for “{query.trim()}” yet — you can still use it as your context.
                </p>
              ) : (
                <ul className="max-h-80 divide-y-2 divide-foreground/10 overflow-y-auto">
                  {results.map((region) => (
                    <li key={region.name} className="p-4">
                      <p className="font-display text-base font-bold">{region.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{region.note}</p>
                      <button
                        type="button"
                        className="mt-2 inline-flex min-h-9 items-center gap-1.5 border-2 border-foreground px-3 text-xs font-bold transition-colors hover:bg-yellow"
                        onClick={() => {
                          setCulture(region.name);
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        {culture === region.name ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Current context
                          </>
                        ) : (
                          <>Use as my context →</>
                        )}
                      </button>
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
                className="w-full border-t-2 border-foreground px-4 py-3 text-left text-xs font-bold transition-colors hover:bg-lime"
              >
                Use “{query.trim()}” as my context →
              </button>
              <p className="border-t-2 border-foreground/10 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
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
