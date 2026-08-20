import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Compass, GraduationCap, Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentAnalysis, setCurrentAnalysis, useSavedScenarios } from "@/lib/analysis/storage";
import { buildStudySet, masteredCount, useReviewProgress } from "@/lib/review/study";
import type { SavedScenario } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review/")({
  head: () => ({
    meta: [
      { title: "Review — CultureLens" },
      {
        name: "description",
        content:
          "Revisit saved situations as flashcards or a short quiz, and practise noticing assumptions before acting on them.",
      },
      { property: "og:title", content: "Learn from past conversations — CultureLens" },
      { property: "og:description", content: "Flashcards and quizzes built from the scenarios you saved." },
    ],
  }),
  component: ReviewHub,
});

type Filter = "selected" | "all" | string;

function ReviewHub() {
  const { scenarios, hydrated, remove } = useSavedScenarios();
  const { get, hydrated: progressReady } = useReviewProgress();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setCurrentId(getCurrentAnalysis()?.id ?? null);
  }, []);

  const gaps = useMemo(
    () => Array.from(new Set(scenarios.map((s) => s.mainGap))).sort(),
    [scenarios],
  );

  const visible = useMemo(() => {
    if (filter === "selected") return scenarios.filter((s) => s.id === currentId);
    if (filter === "all") return scenarios;
    return scenarios.filter((s) => s.mainGap === filter);
  }, [scenarios, filter, currentId]);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-semibold">Learn from past conversations</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Revisit situations, notice assumptions, and practise responding with curiosity.
        </p>
      </header>

      {!hydrated || !progressReady ? (
        <div className="mt-8 space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : scenarios.length === 0 ? (
        <div className="animate-rise card-surface mt-8 p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">Nothing to review yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Once you save an analysis, it becomes a small set of cards here — one on interpretations, one on facts
            versus assumptions, one on responding.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/analyse">
              <Compass className="mr-1.5 h-4 w-4" /> Analyse a situation
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="animate-rise mt-6 flex flex-wrap gap-1.5">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              All saved
            </FilterChip>
            {currentId && scenarios.some((s) => s.id === currentId) && (
              <FilterChip active={filter === "selected"} onClick={() => setFilter("selected")}>
                Current scenario
              </FilterChip>
            )}
            {gaps.map((g) => (
              <FilterChip key={g} active={filter === g} onClick={() => setFilter(g)}>
                {g}
              </FilterChip>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              No saved scenarios match this filter.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {visible.map((s, i) => (
                <ScenarioCard
                  key={s.id}
                  scenario={s}
                  delay={i * 60}
                  progress={get(s.id)}
                  onDelete={() => remove(s.id)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <p className="pt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
        Review at your own pace. There are no streaks or timers here — the point is reflection, not scoring.
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ScenarioCard({
  scenario,
  delay,
  progress,
  onDelete,
}: {
  scenario: SavedScenario;
  delay: number;
  progress: ReturnType<ReturnType<typeof useReviewProgress>["get"]>;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const cards = useMemo(() => buildStudySet(scenario.analysis), [scenario]);
  const mastered = masteredCount(cards, progress);

  return (
    <li className="animate-rise card-surface p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{scenario.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(scenario.savedAt).toLocaleDateString()} · {scenario.setting}
          </p>
        </div>
        <button
          onClick={onDelete}
          aria-label={`Delete ${scenario.title}`}
          className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
          {scenario.mainGap}
        </span>
        <span className="rounded-full bg-sage px-2.5 py-0.5 text-[11px] font-medium text-sage-foreground">
          {scenario.strategy}
        </span>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {cards.length === 0
          ? "This analysis is too sparse for study cards."
          : `${mastered} of ${cards.length} cards marked understood`}
        {progress.lastTotal
          ? ` · last quiz ${progress.lastCorrect}/${progress.lastTotal}`
          : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full text-xs"
          onClick={() => {
            setCurrentAnalysis(scenario.analysis);
            navigate({ to: "/result" });
          }}
        >
          Open analysis
        </Button>
        <Button asChild size="sm" variant="secondary" className="rounded-full text-xs" disabled={cards.length === 0}>
          <Link to="/review/$id/flashcards" params={{ id: scenario.id }}>
            <Layers className="mr-1.5 h-3.5 w-3.5" /> Flashcards
          </Link>
        </Button>
        <Button asChild size="sm" className="rounded-full text-xs">
          <Link to="/review/$id/quiz" params={{ id: scenario.id }}>
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Quiz
          </Link>
        </Button>
      </div>
    </li>
  );
}
