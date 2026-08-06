import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { searchRegions } from "@/lib/analysis/regions";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

        <div ref={wrapRef} className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search a country or region"
            aria-label="Search a country or region"
            className="h-10 w-full rounded-full border border-input bg-card pl-9 pr-9 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {open && query.trim() !== "" && (
            <div className="animate-rise absolute right-0 top-12 w-[min(92vw,26rem)] card-surface overflow-hidden p-1.5">
              {results.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No notes for “{query.trim()}” yet. You can still describe the setting in your own words when you
                  analyse a situation.
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
                        className="mt-2 h-8 rounded-full text-xs"
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                          navigate({ to: "/analyse", search: { region: region.name } });
                        }}
                      >
                        Analyse with this context
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="px-3 pb-2 pt-3 text-[11px] leading-relaxed text-muted-foreground">
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
