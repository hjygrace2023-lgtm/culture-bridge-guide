import { useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { REGION_NOTES } from "@/lib/analysis/regions";
import { useCultureContext } from "@/lib/culture/store";
import { cn } from "@/lib/utils";

/**
 * Compact, editable, clearable display of the shared cultural context.
 * Flat ink-outlined token — no pill, no shadow.
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
        <div
          className={cn(
            "inline-flex max-w-full items-center gap-2 border-2 border-foreground px-3 py-1.5 text-xs",
            culture ? "bg-yellow" : "bg-transparent",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full border-2 border-foreground", culture && "bg-coral")}
          />
          <span className="truncate font-display font-bold">
            {culture ?? <span className="text-foreground/55">No context set</span>}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(culture ?? "");
              setEditing(true);
            }}
            aria-label={culture ? "Change cultural context" : "Set cultural context"}
            className="inline-flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-60"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {culture && (
            <button
              type="button"
              onClick={clearCulture}
              aria-label="Clear cultural context"
              className="inline-flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="animate-rise w-[min(88vw,20rem)] border-2 border-foreground bg-card p-3">
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
            className="h-10 w-full border-0 border-b-2 border-foreground bg-transparent text-sm font-medium outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REGION_NOTES.filter((r) => r.name.toLowerCase().includes(draft.trim().toLowerCase()))
              .slice(0, 5)
              .map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => commit(r.name)}
                  className="border-2 border-foreground px-2.5 py-1 text-xs font-bold transition-colors hover:bg-yellow"
                >
                  {r.name}
                </button>
              ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-2 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => commit(draft)}
              className="border-2 border-foreground bg-foreground px-3 py-1.5 text-xs font-bold text-background"
            >
              Use this →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
