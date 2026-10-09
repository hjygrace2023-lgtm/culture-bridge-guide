import { useLocale } from "@/lib/i18n/store";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Layers, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedScenarios } from "@/lib/analysis/storage";
import { buildQuiz, useReviewProgress, type QuizOption } from "@/lib/review/study";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review/$id/quiz")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: t("Quiz \u2014 CultureLens") },
      {
        name: "description",
        content: t("A short, gentle quiz drawn from one saved analysis: interpretation, evidence, and response."),
      },
      { property: "og:title", content: t("Quiz \u2014 CultureLens") },
      { property: "og:description", content: t("Practise separating evidence from assumption. No timers, no streaks.") },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { t, locale } = useLocale();
  const { id } = Route.useParams();
  const { scenarios, hydrated } = useSavedScenarios();
  const { recordQuiz } = useReviewProgress();

  const scenario = scenarios.find((s) => {t("s.id === id);")}
  const questions = useMemo(() => (scenario ? buildQuiz(scenario.analysis, t) : []), [scenario, t]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<QuizOption | null>(null);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [done, setDone] = useState(false);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-10" aria-busy="true">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!scenario || questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 pt-20 text-center">
        <h1 className="font-display text-2xl font-semibold">
          {scenario ? t("No questions for this one") : t("That scenario isn't saved")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {scenario
            ? t("This saved analysis doesn't carry enough detail to build fair questions. The flashcards may still help.")
            : t("It may have been deleted from this browser. Choose another scenario from the Review hub.")}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {scenario && (
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/review/$id/flashcards" params={{ id }}>
            {t('Flashcards')}
          </Link>
            </Button>
          )}
          <Button asChild className="rounded-full">
            <Link to="/review">{t('Back to Review')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-10 pt-10">
        <div className="animate-rise card-surface p-6 text-center">
          <h1 className="font-display text-2xl font-semibold">{t('Nicely done')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Completed: {total} · Answered as expected: {correct}", { total: questions.length, correct })}
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {missed === 0
              ? t("You consistently chose the reading that stayed close to the evidence. That habit \u2014 hedging where the facts run out \u2014 is what carries across to new situations.")
              : t("The useful part isn't the score. Notice which options tempted you: absolute claims about a group, or certainty about intention, are the two that most often mislead.")}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {missed > 0 && (
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/review/$id/flashcards" params={{ id }}>
                  <Layers className="mr-1.5 h-4 w-4" /> {t("Review missed cards")}
                </Link>
              </Button>
            )}
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                setIndex(0);
                setPicked(null);
                setCorrect(0);
                setMissed(0);
                setDone(false);
              }}
            >
              <RotateCw className="mr-1.5 h-4 w-4" /> {t("Try again")}
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/review">{t('Back to Review Hub')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return null;

  const choose = (option: QuizOption) => {
    if (picked) return;
    setPicked(option);
    if (option.correct) setCorrect((c) => {t("c + 1);")}
    else setMissed((m) => {t("m + 1);")}
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      recordQuiz(id, correct, questions.length);
      setDone(true);
    } else {
      setIndex((i) => {t("i + 1);")}
      setPicked(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-8">
      <div className="animate-rise flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full">
          <Link to="/review">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {t("Review")}
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          {t("Question {current} of {total}", { current: index + 1, total: questions.length })}
        </span>
      </div>

      <h1 className="animate-rise mt-2 font-display text-2xl font-semibold">{scenario.title}</h1>

      <article className="animate-rise card-surface mt-4 p-6">
        <p className="text-sm font-medium leading-relaxed">{t(q.question)}</p>
        <ul className="mt-4 space-y-2">
          {q.options.map((option) => {
            const chosen = picked?.id === option.id;
            const showCorrect = Boolean(picked) && option.correct;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => choose(option)}
                  disabled={Boolean(picked)}
                  aria-pressed={chosen}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left text-sm leading-relaxed transition-all duration-200",
                    showCorrect
                      ? "border-sage-foreground/40 bg-sage text-sage-foreground"
                      : chosen
                        ? "border-destructive/40 bg-destructive/10"
                        : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <span className="flex items-start gap-2">
                    {showCorrect ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : chosen ? (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : null}
                    {t(option.text)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {picked && (
          <div className="animate-flip mt-5 border-t border-border pt-4" aria-live="polite">
            <p className="text-sm leading-relaxed">{t(picked.feedback)}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(q.explanation)}</p>
            <Button className="mt-5 w-full rounded-full" onClick={next}>
              {index + 1 >= questions.length ? t("See reflection") : t("Next question")}
            </Button>
          </div>
        )}
      </article>

      <p className="pt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t('There is rarely one right reply. Where two options could both work, the difference is usually a trade-off between clarity and warmth.')}
          </p>
    </div>
  );
}
