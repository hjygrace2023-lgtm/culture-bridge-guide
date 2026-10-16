import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth/session";
import { useLocale } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";
import { buildQuiz } from "@/lib/review/study";
import type { SavedScenario } from "@/lib/analysis/types";

export const Route = createFileRoute("/review/challenge")({
  head: () => ({
    meta: [
      { title: "Culture Quiz Challenge — CultureLens" },
      { name: "description", content: "Answer real cross-cultural scenarios, earn XP and see how other players answered." },
      { property: "og:title", content: "Culture Quiz Challenge — CultureLens" },
      { property: "og:description", content: "Real scenarios, XP and streaks across eight regions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Challenge,
});

const REGIONS = ["Japan", "China", "South Korea", "United States", "United Kingdom", "France", "Spain", "Germany"];

type Q = { id: string; region: string; scenario: string; question: string; options: { id: string; text: string }[]; difficulty: number };
type Result = {
  correct: boolean;
  correctId: string;
  xp: number;
  streak: number;
  explanation?: string;
  rarity?: { percent?: number; players?: number } | null;
};

function Challenge() {
  const { t } = useLocale();
  const { session, loading } = useSession();
  const [regions, setRegions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [xp, setXp] = useState(0);
  const [right, setRight] = useState(0);
  const [best, setBest] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="mx-auto max-w-2xl px-5 pt-10"><div className="h-60 animate-pulse rounded-2xl bg-muted" /></div>;

  if (!session) {
    return (
      <div className="mx-auto max-w-md px-5 pt-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("Culture Quiz Challenge")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("Sign in to play and keep your XP.")}</p>
        <Button asChild className="mt-6"><Link to="/auth">{t("Sign in")} →</Link></Button>
      </div>
    );
  }

  const syncPersonal = async () => {
    const uid = session.user.id;
    let saved: SavedScenario[] = [];
    try { saved = JSON.parse(localStorage.getItem("culturelens:saved") ?? "[]"); } catch { /* ignore */ }
    if (!saved.length) return;
    const { data: existing } = await supabase.from("quiz_questions").select("concept").eq("owner_id", uid);
    const have = new Set((existing ?? []).map((r) => r.concept));
    const rows = saved.flatMap((s) =>
      buildQuiz(s.analysis).filter((q) => !have.has(q.id) && q.options.some((o) => o.correct)).map((q) => ({
        owner_id: uid, source: "personal", region: t("Your scenario"), category: "personal", difficulty: 2,
        concept: q.id, scenario: s.title, question: q.question,
        options: q.options.map(({ id, text }) => ({ id, text })),
        correct_id: q.options.find((o) => o.correct)!.id,
        feedback: Object.fromEntries(q.options.map((o) => [o.id, o.feedback])),
        explanation: q.explanation,
      })),
    );
    if (rows.length) await supabase.from("quiz_questions").insert(rows);
  };

  const start = async () => {
    setBusy(true); setError(null);
    await syncPersonal().catch(() => {});
    const { data: sid, error: e1 } = await supabase.rpc("start_quiz", { _regions: regions, _size: 10 });
    if (e1 || !sid) { setError(t("The quiz couldn't start. Please try again.")); setBusy(false); return; }
    const { data: s } = await supabase.from("quiz_sessions").select("question_ids").eq("id", sid).single();
    const ids = (s?.question_ids ?? []) as string[];
    const { data: qs } = await supabase.from("quiz_questions").select("id,region,scenario,question,options,difficulty").in("id", ids);
    const ordered = ids.map((id) => qs?.find((q) => q.id === id)).filter(Boolean) as unknown as Q[];
    if (ordered.length === 0) { setError(t("No questions for these regions yet.")); setBusy(false); return; }
    setSessionId(sid); setQuestions(ordered); setI(0); setXp(0); setRight(0); setBest(0); setDone(false);
    setPicked(null); setResult(null); setBusy(false);
  };

  const answer = async (choice: string) => {
    if (picked || !sessionId) return;
    setPicked(choice); setBusy(true);
    const { data, error: e } = await supabase.rpc("submit_answer", { _session: sessionId, _question: questions[i]!.id, _choice: choice });
    setBusy(false);
    if (e || !data) { setError(t("Your answer couldn't be saved.")); return; }
    const r = data as unknown as Result;
    setResult(r);
    setXp((x) => x + (r.xp ?? 0));
    if (r.correct) setRight((n) => n + 1);
    setBest((b) => Math.max(b, r.streak ?? 0));
  };

  const next = async () => {
    if (i + 1 >= questions.length) {
      const { data } = await supabase.rpc("complete_quiz", { _session: sessionId! });
      const bonus = (data as { bonus?: number; xp?: number } | null)?.bonus ?? 100;
      setXp((x) => x + bonus);
      setDone(true);
    } else { setI(i + 1); setPicked(null); setResult(null); }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-10">
        <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
          <p className="text-xs uppercase tracking-widest">{t("Quiz complete")}</p>
          <p className="mt-3 font-display text-6xl font-bold">+{xp} XP</p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-3xl font-bold">{Math.round((right / questions.length) * 100)}%</p>{t("Accuracy")}</div>
            <div><p className="text-3xl font-bold">{best}</p>{t("Best streak")}</div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button onClick={start} disabled={busy}>{t("Play again")} →</Button>
          <Button asChild variant="outline"><Link to="/review">{t("Back to Review")}</Link></Button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-10 pt-8">
        <Link to="/review" className="text-sm text-muted-foreground"><ArrowLeft className="mr-1 inline h-4 w-4" />{t("Review")}</Link>
        <h1 className="mt-3 font-display text-4xl font-bold">{t("Culture Quiz Challenge")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("10 real scenarios. +100 XP per correct answer, double from a 3-answer streak.")}</p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest">{t("Choose regions (optional)")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REGIONS.map((r) => {
            const on = regions.includes(r);
            return (
              <button key={r} type="button" aria-pressed={on}
                onClick={() => setRegions(on ? regions.filter((x) => x !== r) : [...regions, r])}
                className={cn("rounded-lg border-2 border-foreground px-3 py-1.5 text-sm font-medium transition-colors", on ? "bg-foreground text-background" : "bg-background")}>
                {r}
              </button>
            );
          })}
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <Button className="mt-8" size="lg" onClick={start} disabled={busy}>{busy ? t("Loading…") : `${t("Start challenge")} →`}</Button>
      </div>
    );
  }

  const q = questions[i]!;
  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-8">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t("Question {current} of {total}", { current: i + 1, total: questions.length })}</span>
        <span className="font-bold">{xp} XP{result?.streak && result.streak >= 2 ? ` · 🔥 ${result.streak}` : ""}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-foreground transition-all" style={{ width: `${(i / questions.length) * 100}%` }} /></div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{q.region}{q.difficulty >= 3 ? ` · ${t("Hard")}` : ""}</p>
      <p className="mt-2 text-base leading-relaxed">{q.scenario}</p>
      <h2 className="mt-3 font-display text-xl font-semibold">{q.question}</h2>
      <ul className="mt-4 space-y-2">
        {q.options.map((o) => {
          const isRight = result && o.id === result.correctId;
          const isWrong = result && picked === o.id && !result.correct;
          return (
            <li key={o.id}>
              <button type="button" disabled={!!picked} onClick={() => answer(o.id)}
                className={cn("flex w-full items-start gap-2 rounded-xl border-2 p-3 text-left text-sm transition-colors",
                  isRight ? "border-foreground bg-sage text-sage-foreground" : isWrong ? "border-destructive bg-destructive/10" : picked === o.id ? "border-foreground" : "border-border hover:border-foreground")}>
                {isRight && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                {isWrong && <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                {o.text}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {result && (
        <div className="animate-rise mt-5 space-y-3" aria-live="polite">
          <div className={cn("rounded-xl p-4", result.correct ? "bg-accent text-accent-foreground" : "bg-muted")}>
            <p className="font-bold">{result.correct ? `${t("Correct")} +${result.xp} XP` : t("Not quite")}</p>
            {result.explanation && <p className="mt-1 text-sm">{result.explanation}</p>}
          </div>
          <div className="rounded-xl border-2 border-foreground p-4 text-sm">
            {result.rarity && (result.rarity.players ?? 0) >= 30
              ? t("{percent}% of {players} players got this right", { percent: Math.round(result.rarity.percent ?? 0), players: result.rarity.players ?? 0 })
              : t("Not enough player data yet")}
          </div>
          <Button className="w-full" onClick={next}>{i + 1 >= questions.length ? t("See results") : t("Next question")} →</Button>
        </div>
      )}
    </div>
  );
}
