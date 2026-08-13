import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyseSituation } from "@/lib/analysis/engine";
import { getDraftInput, setCurrentAnalysis, setDraftInput } from "@/lib/analysis/storage";
import { CultureContextChip } from "@/components/culture/context-chip";
import { useCultureContext } from "@/lib/culture/store";
import {
  FORMAT_LABEL,
  OUTCOME_LABEL,
  RELATIONSHIP_LABEL,
  type CommunicationFormat,
  type DesiredOutcome,
  type Relationship,
  type SituationInput,
} from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

type AnalyseSearch = { region?: string; example?: boolean; edit?: boolean };

export const Route = createFileRoute("/analyse")({
  validateSearch: (search: Record<string, unknown>): AnalyseSearch => {
    const out: AnalyseSearch = {};
    if (typeof search["region"] === "string") out.region = search["region"];
    if (search["example"] === true || search["example"] === "true") out.example = true;
    if (search["edit"] === true || search["edit"] === "true") out.edit = true;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Analyse a situation — CultureLens" },
      {
        name: "description",
        content: "Describe an intercultural exchange and add as much or as little context as you like.",
      },
      { property: "og:title", content: "Analyse a situation — CultureLens" },
      { property: "og:description", content: "Describe what happened; context fields are always optional." },
    ],
  }),
  component: AnalysePage,
});

const EXAMPLE: SituationInput = {
  situation:
    "I asked my teacher about my grade before results were released. They said, “You don't need to worry about it.” I'm not sure whether that means my grade is good or that they did not want to answer.",
  exactWords: "You don't need to worry about it.",
  relationship: "teacher-student",
  format: "face-to-face",
  desiredOutcome: "understand-meaning",
};

const PLACEHOLDER =
  "I asked my teacher about my grade before results were released. They said, “You don't need to worry about it.” I'm not sure whether that means my grade is good or that they did not want to answer.";

/** Pull the first quoted fragment out of a description, if there is one. */
export function extractQuoted(text: string): string | null {
  const match = text.match(/[“"'‘„«]([^”"'’»]{3,240})[”"'’»]/);
  return match?.[1]?.trim() || null;
}

function AnalysePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { culture } = useCultureContext();

  const initial = (): SituationInput => {
    if (search.example) return EXAMPLE;
    const draft = search.edit ? getDraftInput() : null;
    if (draft) return draft;
    return search.region ? { situation: "", socialContext: search.region } : { situation: "" };
  };

  const [form, setForm] = useState<SituationInput>(initial);
  const [showContext, setShowContext] = useState(Boolean(search.example || search.region || search.edit));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  /* Autofill is one-way only: once the user edits a field by hand, we stop. */
  const touchedWords = useRef(Boolean(initial().exactWords));
  const touchedContext = useRef(Boolean(initial().socialContext));

  const set = <K extends keyof SituationInput>(key: K, value: SituationInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* Exact words ← quotation marks inside the description. */
  useEffect(() => {
    if (touchedWords.current) return;
    const quoted = extractQuoted(form.situation);
    setForm((prev) => (quoted && prev.exactWords !== quoted ? { ...prev, exactWords: quoted } : prev));
  }, [form.situation]);

  /* Social/cultural context ← the globally selected setting (never the whole description). */
  useEffect(() => {
    if (touchedContext.current || !culture) return;
    setForm((prev) => (prev.socialContext === culture ? prev : { ...prev, socialContext: culture }));
  }, [culture]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const situation = form.situation.trim();
    if (situation.length < 20) {
      setError("Please describe what happened in a little more detail — at least a sentence or two.");
      return;
    }
    if (situation.length > 4000) {
      setError("That's longer than the analyser can handle. Please trim it to about 4000 characters.");
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
    <div className="mx-auto max-w-2xl px-5 pb-6 pt-8">
      <div className="animate-rise flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">What happened?</h1>
        <CultureContextChip />
      </div>

      <form onSubmit={onSubmit} className="animate-rise mt-5 space-y-4" style={{ animationDelay: "80ms" }}>
        <div className="card-surface p-4 sm:p-5">
          <Label htmlFor="situation" className="text-sm font-semibold">
            Describe the exchange <span className="text-primary">*</span>
          </Label>
          <Textarea
            id="situation"
            value={form.situation}
            onChange={(e) => set("situation", e.target.value)}
            placeholder={PLACEHOLDER}
            rows={7}
            className="mt-2 resize-y rounded-xl border-input bg-background text-sm leading-relaxed"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{form.situation.trim().length} characters</span>
            <button
              type="button"
              onClick={() => {
                setForm(EXAMPLE);
                touchedWords.current = true;
                setShowContext(true);
              }}
              className="inline-flex min-h-9 items-center gap-1 font-medium text-primary transition-opacity hover:opacity-80"
            >
              <Sparkles className="h-3.5 w-3.5" /> Fill the example
            </button>
          </div>
          {error && (
            <p role="alert" className="animate-rise mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="card-surface overflow-hidden">
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            aria-expanded={showContext}
            className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-muted/50 sm:px-5"
          >
            <span>
              <span className="text-sm font-semibold">Add context</span>
              <span className="ml-2 text-xs text-muted-foreground">optional</span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", showContext && "rotate-180")}
            />
          </button>

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              showContext ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 border-t border-border/70 px-4 py-5 sm:px-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Relationship">
                    <Select
                      value={form.relationship ?? ""}
                      onChange={(v) => set("relationship", (v || undefined) as Relationship | undefined)}
                      options={Object.entries(RELATIONSHIP_LABEL)}
                    />
                  </Field>
                  <Field label="Communication format">
                    <Select
                      value={form.format ?? ""}
                      onChange={(v) => set("format", (v || undefined) as CommunicationFormat | undefined)}
                      options={Object.entries(FORMAT_LABEL)}
                    />
                  </Field>
                  <Field label="Purpose">
                    <Select
                      value={form.desiredOutcome ?? ""}
                      onChange={(v) => set("desiredOutcome", (v || undefined) as DesiredOutcome | undefined)}
                      options={Object.entries(OUTCOME_LABEL)}
                    />
                  </Field>
                </div>

                <Field label="Exact words" hint="filled from quotation marks when we find them">
                  <Textarea
                    value={form.exactWords ?? ""}
                    onChange={(e) => {
                      touchedWords.current = true;
                      set("exactWords", e.target.value);
                    }}
                    rows={2}
                    className="resize-y rounded-xl text-sm"
                    placeholder="“You don't need to worry about it.”"
                  />
                </Field>

                <Field label="Social or cultural context" hint="filled from the setting you chose">
                  <Input
                    value={form.socialContext ?? ""}
                    onChange={(e) => {
                      touchedContext.current = true;
                      set("socialContext", e.target.value);
                    }}
                    placeholder="e.g. a university in Japan"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        {failed && (
          <p role="alert" className="card-surface animate-rise border-destructive/30 p-4 text-sm text-destructive">
            The analysis couldn't be completed just now. Nothing was lost — please try again.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="h-12 w-full rounded-full text-sm shadow-card transition-transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Considering several readings…
            </>
          ) : (
            "Analyse the situation"
          )}
        </Button>

        <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Your text stays in this browser. Nothing is sent to a server or stored in an account in this version. Saved
          scenarios live in your browser's local storage and you can delete them at any time.
        </p>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {hint && <span className="ml-1 opacity-70">· {hint}</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
    >
      <option value="">Not specified</option>
      {options.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
