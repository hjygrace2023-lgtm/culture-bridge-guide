import { useEffect, useRef, useState } from "react";
import { Globe2, Pencil, X } from "lucide-react";
import { REGION_NOTES } from "@/lib/analysis/regions";
import { useCultureContext } from "@/lib/culture/store";
import { cn } from "@/lib/utils";

/**
 * Compact, editable, clearable display of the shared cultural context.
 * Shown on Analyse and Compose so the setting can be changed without going home.
 */
export function CultureContextChip({ className }: { className?: string }) {
  const { culture, setCulture, clearCulture } = useCultureContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setEditing(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function commit(value: string) {
    setCulture(value.trim() ? value : null);
    setEditing(false);
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {!editing ? (
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-card">
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">
            {culture ? (
              <>
                <span className="text-muted-foreground">Context: </span>
                <span className="font-semibold">{culture}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No context set</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(culture ?? "");
              setEditing(true);
            }}
            aria-label={culture ? "Change cultural context" : "Set cultural context"}
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {culture && (
            <button
              type="button"
              onClick={clearCulture}
              aria-label="Clear cultural context"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="animate-rise card-surface w-[min(88vw,20rem)] p-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit(draft);
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="e.g. Japan, or a university in Berlin"
            aria-label="Cultural context"
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {REGION_NOTES.filter((r) => r.name.toLowerCase().includes(draft.trim().toLowerCase()))
              .slice(0, 5)
              .map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => commit(r.name)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
                >
                  {r.name}
                </button>
              ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => commit(draft)}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Use this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
