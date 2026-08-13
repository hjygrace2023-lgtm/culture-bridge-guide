import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Layers, RotateCw, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setCurrentAnalysis, useSavedScenarios } from "@/lib/analysis/storage";
import { PLAUSIBILITY_LABEL, type SavedScenario } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved scenarios — CultureLens" },
      {
        name: "description",
        content: "Revisit the situations you saved, or practise them as flashcards to build your own judgement.",
      },
      { property: "og:title", content: "Saved scenarios — CultureLens" },
      { property: "og:description", content: "Reopen a scenario, or flip through them as flashcards." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { scenarios, hydrated, remove } = useSavedScenarios();
  const [mode, setMode] = useState<"list" | "cards">("list");

  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-8">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Saved scenarios</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Stored in this browser only. No account, no upload.
          </p>
        </div>
        {scenarios.length > 0 && (
          <div className="flex rounded-full bg-muted p-1">
            {(["list", "cards"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
                )}
              >
                {m === "list" ? "List" : "Flashcards"}
              </button>
            ))}
          </div>
        )}
      </div>

      {!hydrated ? (
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : scenarios.length === 0 ? (
        <div className="animate-rise mt-8 card-surface p-8 text-center">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            When an analysis is useful, save it. You can reopen it later or revisit it as a flashcard quiz.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/analyse">Analyse a situation</Link>
          </Button>
        </div>
      ) : mode === "list" ? (
        <ul className="mt-6 space-y-3">
          {scenarios.map((s, i) => (
            <ScenarioRow key={s.id} scenario={s} delay={i * 60} onDelete={() => remove(s.id)} />
          ))}
        </ul>
      ) : (
        <FlashcardDeck scenarios={scenarios} />
      )}
    </div>
  );
}

function ScenarioRow({
  scenario,
  delay,
  onDelete,
}: {
  scenario: SavedScenario;
  delay: number;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
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
      <Button
        size="sm"
        variant="secondary"
        className="mt-3 rounded-full text-xs"
        onClick={() => {
          setCurrentAnalysis(scenario.analysis);
          navigate({ to: "/result" });
        }}
      >
        Reopen analysis
      </Button>
    </li>
  );
}

function FlashcardDeck({ scenarios }: { scenarios: SavedScenario[] }) {
  const [order, setOrder] = useState<number[]>(() => scenarios.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const index = order[Math.min(pos, order.length - 1)] ?? 0;
  const scenario = scenarios[index];
  const top = useMemo(
    () => scenario?.analysis.interpretations.slice(0, 3) ?? [],
    [scenario],
  );

  if (!scenario) return null;

  const go = (delta: number) => {
    setFlipped(false);
    setPos((p) => (p + delta + order.length) % order.length);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Card {pos + 1} of {order.length}
        </span>
        <button
          onClick={() => {
            setOrder((o) => [...o].sort(() => Math.random() - 0.5));
            setPos(0);
            setFlipped(false);
          }}
          className="inline-flex items-center gap-1 font-medium text-primary"
        >
          <Shuffle className="h-3.5 w-3.5" /> Shuffle
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="animate-rise mt-3 w-full card-surface p-6 text-left transition-all duration-300 hover:shadow-lift"
      >
        {!flipped ? (
          <div className="min-h-52">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">The situation</p>
            <p className="mt-3 text-sm leading-relaxed">{scenario.analysis.input.situation}</p>
            <p className="mt-4 text-xs text-muted-foreground">{scenario.setting}</p>
            <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <RotateCw className="h-3.5 w-3.5" /> Think of two possible readings, then tap to reveal
            </p>
          </div>
        ) : (
          <div className="min-h-52">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Possible readings</p>
            <ul className="mt-3 space-y-2">
              {top.map((it) => (
                <li key={it.id} className="rounded-xl bg-muted/60 p-3">
                  <p className="text-sm font-semibold">{it.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{PLAUSIBILITY_LABEL[it.plausibility]}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Strategy: </span>
              {scenario.strategy}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Clarifying question: </span>
              {scenario.analysis.clarificationQuestion}
            </p>
          </div>
        )}
      </button>

      <div className="mt-3 flex items-center justify-between">
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => go(-1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => setFlipped((f) => !f)}>
          {flipped ? "Hide" : "Reveal"}
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => go(1)}>
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
