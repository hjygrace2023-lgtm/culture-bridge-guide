import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Eye, GraduationCap, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedScenarios } from "@/lib/analysis/storage";
import { buildStudySet, orderCards, useReviewProgress, type StudyCard } from "@/lib/review/study";

export const Route = createFileRoute("/review/$id/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — CultureLens" },
      {
        name: "description",
        content: "Turn a saved situation over in your mind one card at a time: interpretations, facts, response.",
      },
      { property: "og:title", content: "Flashcards — CultureLens" },
      { property: "og:description", content: "A calm, three-card review of one saved situation." },
    ],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const { id } = Route.useParams();
  const { scenarios, hydrated } = useSavedScenarios();
  const { get, hydrated: progressReady, markCard } = useReviewProgress();

  const scenario = scenarios.find((s) => s.id === id);
  const [deck, setDeck] = useState<StudyCard[] | null>(null);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const cards = useMemo(() => (scenario ? buildStudySet(scenario.analysis) : []), [scenario]);
  const progress = get(id);

  // Order once per session so marking a card doesn't reshuffle underneath you.
  useEffect(() => {
    if (!hydrated || !progressReady || deck) return;
    if (cards.length) setDeck(orderCards(cards, progress));
  }, [hydrated, progressReady, cards, progress, deck]);

  if (!hydrated || !progressReady) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-10" aria-busy="true">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!scenario || cards.length === 0) {
    return (
      <Missing
        title={scenario ? "Not enough to study here" : "That scenario isn't saved"}
        body={
          scenario
            ? "This analysis doesn't contain enough detail to build study cards. Try reviewing another saved scenario."
            : "It may have been deleted from this browser. Pick another one from the Review hub."
        }
      />
    );
  }

  const list = deck ?? cards;
  const card = list[Math.min(pos, list.length - 1)] as StudyCard;
  const status = progress.cards[card.id];

  const advance = () => {
    setRevealed(false);
    setPos((p) => Math.min(p + 1, list.length - 1));
  };
  const atEnd = pos >= list.length - 1;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-8">
      <div className="animate-rise flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
          <Link to="/review">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Review
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Card {pos + 1} of {list.length}
        </span>
      </div>

      <h1 className="animate-rise mt-2 font-display text-2xl font-semibold">{scenario.title}</h1>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted" role="presentation">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${((pos + 1) / list.length) * 100}%` }}
        />
      </div>

      <article className="animate-rise card-surface mt-4 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{card.label}</p>
        <p className="mt-3 text-sm leading-relaxed">{card.front}</p>
        <p className="mt-4 text-sm font-medium">{card.prompt}</p>

        {!revealed ? (
          <Button className="mt-6 w-full rounded-full" onClick={() => setRevealed(true)}>
            <Eye className="mr-1.5 h-4 w-4" /> Reveal insight
          </Button>
        ) : (
          <div className="animate-flip mt-6 border-t border-border pt-5" aria-live="polite">
            {card.back.map((section) => (
              <section key={section.heading} className="mt-4 first:mt-0">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.heading}
                </h2>
                <ul className="mt-2 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-xl bg-muted/60 p-3 text-sm leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{card.reminder}</p>
          </div>
        )}
      </article>

      {revealed && (
        <div className="animate-rise mt-3 grid gap-2 sm:grid-cols-3">
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              markCard(id, card.id, "again");
              atEnd ? setRevealed(false) : advance();
            }}
          >
            <RotateCw className="mr-1.5 h-4 w-4" /> Review again
          </Button>
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              markCard(id, card.id, "mastered");
              atEnd ? setRevealed(false) : advance();
            }}
          >
            <Check className="mr-1.5 h-4 w-4" /> I understand
          </Button>
          {atEnd ? (
            <Button asChild className="rounded-full">
              <Link to="/review/$id/quiz" params={{ id }}>
                <GraduationCap className="mr-1.5 h-4 w-4" /> Try the quiz
              </Link>
            </Button>
          ) : (
            <Button className="rounded-full" onClick={advance}>
              Next card
            </Button>
          )}
        </div>
      )}

      {status && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {status === "mastered"
            ? "Marked as understood — it'll come last next time."
            : "Marked for another look — it'll come first next time."}
        </p>
      )}
    </div>
  );
}

function Missing({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md px-5 pt-20 text-center">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button asChild className="mt-6 rounded-full">
        <Link to="/review">Back to Review</Link>
      </Button>
    </div>
  );
}
