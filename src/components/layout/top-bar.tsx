import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Palette, Search, X } from "lucide-react";
import { searchRegions } from "@/lib/analysis/regions";
import { Button } from "@/components/ui/button";
import { CULTURE_THEMES, themeForRegion, useCultureTheme } from "@/lib/theme/culture-theme";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { id: themeId, select } = useCultureTheme();

  const results = useMemo(() => searchRegions(query), [query]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
        setPaletteOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 py-2.5 sm:px-5">
        <Link to="/" className="shrink-0 font-display text-base font-semibold tracking-tight sm:text-lg">
          Culture<span className="text-primary">Lens</span>
        </Link>

        <div ref={wrapRef} className="relative ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <div className="relative min-w-0 flex-1 sm:max-w-[15rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setPaletteOpen(false);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Country or region"
              aria-label="Search a country or region"
              className="h-10 w-full rounded-full border border-input bg-card pl-9 pr-8 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            aria-label="Background pattern"
            onClick={() => {
              setPaletteOpen((v) => !v);
              setOpen(false);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-input bg-card text-muted-foreground"
          >
            <Palette className="h-4 w-4" />
          </button>

          {paletteOpen && (
            <div className="animate-rise absolute right-0 top-12 z-50 w-56 card-surface p-1.5">
              <p className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">Background pattern</p>
              {CULTURE_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    select(t.id);
                    setPaletteOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                    themeId === t.id && "bg-accent text-accent-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {open && query.trim() !== "" && (
            <div className="animate-rise absolute right-0 top-12 z-50 w-[min(92vw,24rem)] card-surface overflow-hidden p-1.5">
              {results.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  No notes for “{query.trim()}” yet — you can still describe the setting in your own words.
                </p>
              ) : (
                <ul className="max-h-72 space-y-1 overflow-y-auto">
                  {results.map((region) => (
                    <li key={region.name} className="rounded-xl p-3">
                      <p className="text-sm font-semibold">{region.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{region.note}</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2 h-9 rounded-full text-xs"
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                          select(themeForRegion(region.name));
                          navigate({ to: "/analyse", search: { region: region.name } });
                        }}
                      >
                        Use this context
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="px-3 pb-2 pt-2 text-[11px] leading-relaxed text-muted-foreground">
                Tendencies reported in some settings — never a description of one person.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
