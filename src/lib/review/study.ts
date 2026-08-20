import { useCallback, useEffect, useState } from "react";
import type { Analysis } from "../analysis/types";
import { PLAUSIBILITY_LABEL } from "../analysis/types";

/**
 * Deterministic study-set builder.
 * No AI call, no network: every card and question is derived from the saved
 * `Analysis` object already stored in this browser.
 */

export type StudyCardKind = "interpretation" | "facts" | "strategy";

export interface StudyCard {
  id: string;
  kind: StudyCardKind;
  label: string;
  front: string;
  prompt: string;
  back: { heading: string; items: string[] }[];
  reminder: string;
}

function shorten(text: string, max = 220) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

export function buildStudySet(analysis: Analysis): StudyCard[] {
  const cards: StudyCard[] = [];

  if (analysis.interpretations.length > 0) {
    cards.push({
      id: `${analysis.id}:interpretation`,
      kind: "interpretation",
      label: "Interpretations",
      front: shorten(analysis.input.exactWords?.trim() || analysis.input.situation),
      prompt: "What might this have meant? Hold two or three readings in mind before revealing.",
      back: [
        { heading: "Read literally", items: [analysis.literalMeaning] },
        {
          heading: "Plausible readings",
          items: analysis.interpretations
            .slice(0, 4)
            .map((i) => `${i.title} — ${i.mightHaveMeant} (${PLAUSIBILITY_LABEL[i.plausibility]})`),
        },
      ],
      reminder:
        "These are possibilities, not verdicts. The same words can carry different meanings for two people from the same place.",
    });
  }

  if (analysis.observed.length > 0 || analysis.inferred.length > 0) {
    cards.push({
      id: `${analysis.id}:facts`,
      kind: "facts",
      label: "Facts vs assumptions",
      front: shorten(analysis.input.situation),
      prompt: "What did you actually observe here, and what did you add yourself?",
      back: [
        { heading: "Observed", items: analysis.observed },
        { heading: "Inferred (added by you or by me)", items: analysis.inferred },
      ],
      reminder: "Inferences are useful working guesses — they just aren't evidence yet.",
    });
  }

  if (analysis.strategy?.name) {
    const balanced =
      analysis.responses.find((r) => r.style === "balanced")?.wording ?? analysis.responses[0]?.wording;
    cards.push({
      id: `${analysis.id}:strategy`,
      kind: "strategy",
      label: "Responding",
      front: shorten(analysis.title),
      prompt: "What would be the most useful next step here?",
      back: [
        { heading: "Suggested strategy", items: [`${analysis.strategy.name} — ${analysis.strategy.why}`] },
        {
          heading: "Something you could say",
          items: [analysis.clarificationQuestion, balanced].filter(Boolean) as string[],
        },
        ...(analysis.strategy.cautions ? [{ heading: "Worth weighing", items: [analysis.strategy.cautions] }] : []),
      ],
      reminder: "A strategy that worked once does not transfer identically to the next situation.",
    });
  }

  return cards;
}

/* ------------------------------------------------------------------- quiz */

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
}

export function buildQuiz(analysis: Analysis): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const top = analysis.interpretations[0];
  const second = analysis.interpretations[1];

  if (top && second) {
    questions.push({
      id: `${analysis.id}:q-interpretation`,
      question: "Which reading of this exchange is best justified by what you actually know?",
      options: shuffle(
        [
          {
            id: "a",
            text: `${top.mightHaveMeant} — though this remains one plausible reading among several.`,
            correct: true,
            feedback: "Yes. It stays close to the evidence and leaves room for other readings.",
          },
          {
            id: "b",
            text: `People from that background always mean ${second.mightHaveMeant.toLowerCase()}`,
            correct: false,
            feedback: "A whole group never shares one fixed meaning. Background shifts probabilities, never certainties.",
          },
          {
            id: "c",
            text: "They were clearly being rude, and the intention behind it is not in doubt.",
            correct: false,
            feedback: "Certainty about intention is exactly what this situation does not give you.",
          },
          {
            id: "d",
            text: "Nothing at all can be said until they explain themselves.",
            correct: false,
            feedback: "You can hold careful hypotheses while you wait for more information.",
          },
        ],
        analysis.id.length,
      ),
      explanation:
        top.whyPlausible ||
        "The most defensible reading stays tentative and points at the clues that support it.",
    });
  }

  const inferred = analysis.inferred[0];
  const observedThree = analysis.observed.slice(0, 3);
  if (inferred && observedThree.length >= 3) {
    questions.push({
      id: `${analysis.id}:q-facts`,
      question: "Which of these is an inference rather than something you observed?",
      options: shuffle(
        [
          { id: "a", text: inferred, correct: true, feedback: "Correct — this is a guess about meaning, not an observation." },
          ...observedThree.map((o, i) => ({
            id: `o${i}`,
            text: o,
            correct: false,
            feedback: "This one is observable — it happened, whatever it meant.",
          })),
        ],
        analysis.id.length + 1,
      ),
      explanation:
        "Separating what happened from what you concluded is the quickest way to notice an assumption before acting on it.",
    });
  }

  if (analysis.strategy?.name) {
    const gentle = analysis.responses.find((r) => r.style === "gentle");
    questions.push({
      id: `${analysis.id}:q-strategy`,
      question: "Given your goal here, which response is most likely to help?",
      options: shuffle(
        [
          {
            id: "a",
            text: `${analysis.strategy.name}: ${analysis.clarificationQuestion}`,
            correct: true,
            feedback: "Yes — it seeks information before assigning intent.",
          },
          {
            id: "b",
            text: "Tell them their culture's way of communicating is the problem.",
            correct: false,
            feedback: "Framing a group as the problem closes the conversation and rarely reflects the individual.",
          },
          {
            id: "c",
            text: "Say nothing, and quietly decide what they meant.",
            correct: false,
            feedback: "Understandable, but it locks in an assumption you can't check.",
          },
          {
            id: "d",
            text: gentle
              ? `${gentle.wording} — and then treat the matter as fully settled.`
              : "Apologise immediately, whether or not anything went wrong.",
            correct: false,
            feedback: gentle
              ? "The wording is fine; treating it as settled is the part that misfires."
              : "Pre-emptive apology can work, but it can also confirm a misreading.",
          },
        ],
        analysis.id.length + 2,
      ),
      explanation: [
        analysis.strategy.why,
        analysis.responses.length > 1
          ? "More than one reply could work here — a gentler wording protects the relationship, a more direct one gets clarity faster. The trade-off is yours to choose."
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  return questions.slice(0, 3);
}

/** Deterministic rotation so option order is stable per scenario but not always first. */
function shuffle<T>(items: T[], seed: number): T[] {
  const offset = seed % items.length;
  return items.map((_, i) => items[(i + offset) % items.length] as T);
}

/* --------------------------------------------------------------- progress */

export type CardStatus = "again" | "mastered";

export interface ScenarioProgress {
  cards: Record<string, CardStatus>;
  quizAttempts: number;
  lastCorrect?: number;
  lastTotal?: number;
  updatedAt?: string;
}

type ProgressMap = Record<string, ScenarioProgress>;

const KEY = "culturelens:review-progress";
const empty: ScenarioProgress = { cards: {}, quizAttempts: 0 };

function readAll(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ProgressMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* private mode — progress simply isn't remembered */
  }
}

export function useReviewProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(readAll());
    setHydrated(true);
  }, []);

  const update = useCallback((id: string, fn: (p: ScenarioProgress) => ScenarioProgress) => {
    setProgress((prev) => {
      const next = { ...prev, [id]: fn(prev[id] ?? empty) };
      writeAll(next);
      return next;
    });
  }, []);

  const markCard = useCallback(
    (scenarioId: string, cardId: string, status: CardStatus) =>
      update(scenarioId, (p) => ({
        ...p,
        cards: { ...p.cards, [cardId]: status },
        updatedAt: new Date().toISOString(),
      })),
    [update],
  );

  const recordQuiz = useCallback(
    (scenarioId: string, correct: number, total: number) =>
      update(scenarioId, (p) => ({
        ...p,
        quizAttempts: p.quizAttempts + 1,
        lastCorrect: correct,
        lastTotal: total,
        updatedAt: new Date().toISOString(),
      })),
    [update],
  );

  const get = useCallback((id: string) => progress[id] ?? empty, [progress]);

  return { progress, hydrated, get, markCard, recordQuiz };
}

/** Cards marked "review again" come first; mastered ones last. */
export function orderCards(cards: StudyCard[], p: ScenarioProgress): StudyCard[] {
  const rank = (c: StudyCard) => (p.cards[c.id] === "again" ? 0 : p.cards[c.id] === "mastered" ? 2 : 1);
  return [...cards].sort((a, b) => rank(a) - rank(b));
}

export function masteredCount(cards: StudyCard[], p: ScenarioProgress) {
  return cards.filter((c) => p.cards[c.id] === "mastered").length;
}
