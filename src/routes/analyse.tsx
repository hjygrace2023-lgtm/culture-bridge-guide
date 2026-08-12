import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyseSituation } from "@/lib/analysis/engine";
import { getDraftInput, setCurrentAnalysis, setDraftInput } from "@/lib/analysis/storage";
import {
  RELATIONSHIP_OPTIONS,
  OUTCOME_OPTIONS,
  type DesiredOutcome,
  type Relationship,
  type SituationInput,
} from "@/lib/analysis/types";

type AnalyseSearch = { region?: string | undefined; example?: boolean | undefined; edit?: boolean | undefined };

export const Route = createFileRoute("/analyse")({
  validateSearch: (search: Record<string, unknown>): AnalyseSearch => ({
    region: typeof search["region"] === "string" ? (search["region"] as string) : undefined,
    example: search["example"] === true || search["example"] === "true" ? true : undefined,
    edit: search["edit"] === true || search["edit"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Analyse a situation — CultureLens" },
      {
        name: "description",
        content: "Describe an intercultural exchange in one box. Everything else is optional.",
      },
      { property: "og:title", content: "Analyse a situation — CultureLens" },
      { property: "og:description", content: "One box is enough — context fields are always optional." },
    ],
  }),
  component: AnalysePage,
});

const EXAMPLE: SituationInput = {
  situation:
    "I asked my teacher about my grade before results were released. They said, “You don't need to worry about it.” I'm not sure whether that means my grade is good or that they did not want to answer.",
  exactWords: "You don't need to worry about it.",
  relationship: "teacher-student",
  socialContext: "a university in Japan",
  beforeAfter: "They were packing up and changed the subject afterwards.",
  desiredOutcome: "understand-meaning",
};

const PLACEHOLDER =
  "e.g. I asked my teacher about my grade and they said “You don't need to worry about it.” I can't tell whether that's reassurance or a way of not answering.";

function AnalysePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const initial = (): SituationInput => {
    if (search.example) return EXAMPLE;
    const draft = search.edit ? getDraftInput() : null;
    if (draft) return draft;
    return search.region ? { situation: "", socialContext: search.region } : { situation: "" };
  };

  const [form, setForm] = useState<SituationInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const set = <K extends keyof SituationInput>(key: K, value: SituationInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const situation = form.situation.trim();
    if (situation.length < 20) {
      setError("A sentence or two is enough — just a little more detail.");
      return;
    }
    if (situation.length > 4000) {
      setError("That's a bit long. Please trim it to about 4000 characters.");
      return;
    }
    setError(null);
    setFailed(false);
    setLoading(true);
    try {
      const input = { ...form, situation };
      setDraftInput(input);
      const analysis = await analyseSituation(input);
      setCurrentAnalysis(analysis);
      navigate({ to: "/result" });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-6 sm:px-5">
      <h1 className="animate-rise font-display text-2xl font-semibold sm:text-3xl">What happened?</h1>
      <p className="animate-rise mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Describe it in your own words. Everything else is optional.
      </p>

      <form onSubmit={onSubmit} className="animate-rise mt-5 space-y-3" style={{ animationDelay: "60ms" }}>
        <div className="card-surface p-4">
          <Textarea
            id="situation"
            aria-label="What happened"
            value={form.situation}
            onChange={(e) => set("situation", e.target.value)}
            placeholder={PLACEHOLDER}
            rows={6}
            className="resize-y rounded-xl border-input bg-background text-base leading-relaxed sm:text-sm"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{form.situation.trim().length} characters</span>
            <button
              type="button"
              onClick={() => setForm(EXAMPLE)}
              className="inline-flex items-center gap-1 py-1 font-medium text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" /> Use an example
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="card-surface grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Who was it? · optional</Label>
            <Select
              className="mt-1.5"
              value={form.relationship ?? ""}
              onChange={(v) => set("relationship", (v || undefined) as Relationship | undefined)}
              placeholder="Anyone"
              options={RELATIONSHIP_OPTIONS}
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">What do you want? · optional</Label>
            <Select
              className="mt-1.5"
              value={form.desiredOutcome ?? ""}
              onChange={(v) => set("desiredOutcome", (v || undefined) as DesiredOutcome | undefined)}
              placeholder="Just to understand it"
              options={OUTCOME_OPTIONS}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground">Where / setting · optional</Label>
            <Input
              className="mt-1.5 h-11 rounded-xl text-base sm:h-10 sm:text-sm"
              value={form.socialContext ?? ""}
              onChange={(e) => set("socialContext", e.target.value)}
              placeholder="e.g. a university in Japan"
            />
          </div>
        </div>

        {failed && (
          <p role="alert" className="card-surface border-destructive/30 p-4 text-sm text-destructive">
            That didn't go through. Nothing was lost — please try again.
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="h-12 w-full rounded-full text-sm">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Considering several readings…
            </>
          ) : (
            "Analyse the situation"
          )}
        </Button>

        <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3 w-3 shrink-0" />
          Everything stays in this browser.
        </p>
      </form>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  placeholder: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring/40 sm:h-10 sm:text-sm ${className ?? ""}`}
    >
      <option value="">{placeholder}</option>
      {options.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
