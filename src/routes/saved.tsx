import { useLocale } from "@/lib/i18n/store";
import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Layers, RotateCw, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/page-heading";
import { setCurrentAnalysis, useSavedScenarios } from "@/lib/analysis/storage";
import { PLAUSIBILITY_LABEL, type SavedScenario } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: t("Saved scenarios \u2014 CultureLens") },
      {
        name: "description",
        content: t("Revisit the situations you saved, or practise them as flashcards to build your own judgement."),
      },
      { property: "og:title", content: t("Saved scenarios \u2014 CultureLens") },
      { property: "og:description", content: t("Reopen a scenario, or flip through them as flashcards.") },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { t, locale } = useLocale();
  const { scenarios, hydrated, remove } = useSavedScenarios();
  const [mode, setMode] = useState<"list" | "cards">("list");

  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-8 sm:px-8">
      <PageHeading
        eyebrow={t('Your own archive')}
        title={
          <>
            {t('Saved')}
          <br />
            {t('Scenarios')}
          </>
        }
        lede={t('Stored in this browser only. No account, no upload.')}
      />

      {scenarios.length > 0 && (
        <div className="mt-5 flex border-2 border-foreground">
          {(["list", "cards"] as const).map((m, i) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.08em] transition-colors",
                i > 0 && "border-l-2 border-foreground",
                mode === m ? "bg-foreground text-background" : "hover:bg-yellow",
              )}
            >
              {m === "list" ? t("List") : t("Flashcards")}
            </button>
          ))}
        </div>
      )}

      {!hydrated ? (
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : scenarios.length === 0 ? (
        <div className="animate-rise mt-8 card-surface p-8 text-center">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">{t('Nothing saved yet')}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {t('When an analysis is useful, save it. You can reopen it later or revisit it as a flashcard quiz.')}
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/analyse">{t('Analyse a situation')}</Link>
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
  onDelete: () => {t("void;")}
}) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  return (
    <li className="animate-rise card-surface p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{scenario.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(scenario.savedAt).toLocaleDateString(locale)} · {t(scenario.setting)}
          </p>
        </div>
        <button
          onClick={onDelete}
          aria-label={t("Delete {t(title)}", { title: scenario.title })}
          className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground">
          {t(scenario.mainGap)}
        </span>
        <span className="rounded-full bg-sage px-2.5 py-0.5 text-[11px] font-medium text-sage-foreground">
          {t(scenario.strategy)}
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
            {t('Reopen analysis')}
          </Button>
    </li>
  );
}

function FlashcardDeck({ scenarios }: { scenarios: SavedScenario[] }) {
  const { t, locale } = useLocale();
  const [order, setOrder] = useState<number[]>(() => scenarios.map((_, i) => {t("i));")}
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const index = order[Math.min(pos, order.length - 1)] ?? 0;
  const scenario = scenarios[index];
  const top = useMemo(
    () => {t("scenario?.analysis.interpretations.slice(0, 3) ?? [],")}
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
          {t("Card {current} of {total}", { current: pos + 1, total: order.length })}
        </span>
        <button
          onClick={() => {
            setOrder((o) => [...o].sort(() => {t("Math.random() - 0.5));")}
            setPos(0);
            setFlipped(false);
          }}
          className="inline-flex items-center gap-1 font-medium text-primary"
        >
          <Shuffle className="h-3.5 w-3.5" /> {t("Shuffle")}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="animate-rise mt-3 w-full card-surface p-6 text-left transition-all duration-300 hover:shadow-lift"
      >
        {!flipped ? (
          <div className="min-h-52">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('The situation')}</p>
            <p className="mt-3 text-sm leading-relaxed">{scenario.analysis.input.situation}</p>
            <p className="mt-4 text-xs text-muted-foreground">{t(scenario.setting)}</p>
            <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <RotateCw className="h-3.5 w-3.5" /> {t("Think of two possible readings, then tap to reveal")}
            </p>
          </div>
        ) : (
          <div className="min-h-52">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('Possible readings')}</p>
            <ul className="mt-3 space-y-2">
              {top.map((it) => (
                <li key={it.id} className="rounded-xl bg-muted/60 p-3">
                  <p className="text-sm font-semibold">{it.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(PLAUSIBILITY_LABEL[it.plausibility])}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{t('Strategy:')}</span>
              {t(scenario.strategy)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{t('Clarifying question:')}</span>
              {scenario.analysis.clarificationQuestion}
            </p>
          </div>
        )}
      </button>

      <div className="mt-3 flex items-center justify-between">
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => go(-1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> {t("Previous")}
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => setFlipped((f) => !f)}>
          {flipped ? t("Hide") : t("Reveal")}
        </Button>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => go(1)}>
          {t("Next")} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
