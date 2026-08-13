import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  HelpCircle,
  Lightbulb,
  Plus,
  RefreshCw,
  Save,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentAnalysis } from "@/lib/analysis/storage";
import { useSavedScenarios } from "@/lib/analysis/storage";
import { analysisToText } from "@/lib/analysis/format";
import {
  PLAUSIBILITY_LABEL,
  TONE_LABEL,
  type Analysis,
  type FactorKind,
  type ToneKey,
} from "@/lib/analysis/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Analysis — CultureLens" },
      {
        name: "description",
        content: "Several plausible readings of your situation, what may be creating the gap, and ways to respond.",
      },
      { property: "og:title", content: "Analysis — CultureLens" },
      { property: "og:description", content: "Possibilities, not verdicts." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [ready, setReady] = useState(false);
  const { save } = useSavedScenarios();
  const navigate = useNavigate();

  useEffect(() => {
    setAnalysis(getCurrentAnalysis());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-5 pt-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-md px-5 pt-20 text-center">
        <h1 className="font-display text-2xl font-semibold">No analysis open</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe a situation and CultureLens will lay out the possible readings here.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/analyse">Analyse a situation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-5 pb-8 pt-8">
      <header className="animate-rise">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Analysis</p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-snug">{analysis.title}</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          These are possibilities drawn from what you described. There is not enough information to determine the
          speaker's intention with certainty.
        </p>
      </header>

      {analysis.safetyNotice && (
        <div className="animate-rise rounded-2xl border border-clay-foreground/25 bg-clay/60 p-4 text-clay-foreground">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" /> Before going further
          </p>
          <p className="mt-2 text-xs leading-relaxed">{analysis.safetyNotice}</p>
        </div>
      )}

      <Section n={1} title="What was literally communicated" icon={<Eye className="h-4 w-4" />}>
        {analysis.input.exactWords?.trim() && (
          <div className="mb-3">
            <Bubble side="assistant" label="Their words">
              {analysis.input.exactWords.trim()}
            </Bubble>
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">{analysis.literalMeaning}</p>
      </Section>

      <Section n={2} title="Plausible interpretations" icon={<Lightbulb className="h-4 w-4" />}>
        <div className="space-y-3">
          {analysis.interpretations.map((it, i) => (
            <article
              key={it.id}
              className="animate-rise rounded-xl border border-border/80 bg-background/60 p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{it.title}</h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    it.plausibility === "more-plausible" && "bg-sage text-sage-foreground",
                    it.plausibility === "possible" && "bg-sand text-sand-foreground",
                    it.plausibility === "requires-more-context" && "bg-lilac text-lilac-foreground",
                  )}
                >
                  {PLAUSIBILITY_LABEL[it.plausibility]}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.mightHaveMeant}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Why this is plausible: </span>
                {it.whyPlausible}
              </p>
              <ul className="mt-2 space-y-1">
                {it.clues.map((clue) => (
                  <li key={clue} className="text-xs leading-relaxed text-muted-foreground">
                    · {clue}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section n={3} title="What may be creating the gap" icon={<Scale className="h-4 w-4" />}>
        <div className="space-y-4">
          {(["cultural", "individual", "situational"] as FactorKind[]).map((kind) => {
            const items = analysis.gapFactors.filter((f) => f.kind === kind);
            if (!items.length) return null;
            return (
              <div key={kind}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {kind === "cultural"
                    ? "Cultural patterns (tendencies, not rules)"
                    : kind === "individual"
                      ? "Individual factors"
                      : "Situational factors"}
                </p>
                <div className="mt-2 space-y-2">
                  {items.map((f) => (
                    <div key={f.id} className="rounded-xl bg-muted/60 p-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          kind === "cultural" && "bg-accent text-accent-foreground",
                          kind === "individual" && "bg-lilac text-lilac-foreground",
                          kind === "situational" && "bg-sand text-sand-foreground",
                        )}
                      >
                        {f.tag}
                      </span>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section n={4} title="Facts versus assumptions" icon={<Scale className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-sage/40 p-4">
            <p className="text-xs font-semibold text-sage-foreground">What you observed</p>
            <ul className="mt-2 space-y-1.5">
              {analysis.observed.map((o) => (
                <li key={o} className="text-xs leading-relaxed text-muted-foreground">
                  · {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-sand/50 p-4">
            <p className="text-xs font-semibold text-sand-foreground">What you may be inferring</p>
            <ul className="mt-2 space-y-1.5">
              {analysis.inferred.map((o) => (
                <li key={o} className="text-xs leading-relaxed text-muted-foreground">
                  · {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section n={5} title="What remains uncertain" icon={<HelpCircle className="h-4 w-4" />}>
        <ul className="space-y-1.5">
          {analysis.uncertainties.map((u) => (
            <li key={u} className="text-sm leading-relaxed text-muted-foreground">
              · {u}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-muted/60 p-3">
          <p className="text-xs font-semibold">What would sharpen this</p>
          <ul className="mt-1.5 space-y-1">
            {analysis.wouldHelp.map((w) => (
              <li key={w} className="text-xs leading-relaxed text-muted-foreground">
                · {w}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section n={6} title="Recommended strategy" icon={<Lightbulb className="h-4 w-4" />}>
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {analysis.strategy.name}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{analysis.strategy.why}</p>
        {analysis.strategy.cautions && (
          <p className="mt-3 rounded-xl bg-clay/50 p-3 text-xs leading-relaxed text-clay-foreground">
            {analysis.strategy.cautions}
          </p>
        )}
      </Section>

      <Section n={7} title="Ways you could respond" icon={<Copy className="h-4 w-4" />}>
        <ResponseList analysis={analysis} />
      </Section>

      <Section n={8} title="Best clarification question" icon={<HelpCircle className="h-4 w-4" />}>
        <p className="rounded-xl bg-accent/60 p-4 text-sm leading-relaxed text-accent-foreground">
          {analysis.clarificationQuestion}
        </p>
        <CopyButton className="mt-3" value={analysis.clarificationQuestion} label="Copy question" />
      </Section>

      <div className="animate-rise grid gap-2 pt-2 sm:grid-cols-2">
        <Button asChild variant="secondary" className="rounded-full">
          <Link to="/analyse" search={{ edit: true }}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Edit context and analyse again
          </Link>
        </Button>
        <CopyButton value={analysisToText(analysis)} label="Copy full analysis" variant="secondary" full />
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={() => {
            save(analysis);
            toast.success("Scenario saved to this browser");
          }}
        >
          <Save className="mr-1.5 h-4 w-4" /> Save scenario
        </Button>
        <Button className="rounded-full" onClick={() => navigate({ to: "/analyse" })}>
          <Plus className="mr-1.5 h-4 w-4" /> Start a new scenario
        </Button>
      </div>

      <p className="pt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        Tone, institutional policy, the relationship and previous interactions could all change how this exchange
        should be read. CultureLens identifies possibilities, not people's definite intentions.
      </p>
    </div>
  );
}

function ResponseList({ analysis }: { analysis: Analysis }) {
  const [tone, setTone] = useState<ToneKey | null>(null);
  const tones = useMemo(() => Object.entries(TONE_LABEL) as [ToneKey, string][], []);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {tones.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTone((t) => (t === key ? null : key))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
              tone === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {analysis.responses.map((r, i) => {
          const wording = (tone && r.toneVariants[tone]) || r.wording;
          return (
            <article
              key={r.id}
              className="animate-rise rounded-xl border border-border/80 bg-background/60 p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <h3 className="text-sm font-semibold">{r.label}</h3>
              <div className="mt-2">
                <Bubble side="user">{wording}</Bubble>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Likely effect: </span>
                {r.likelyEffect}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Trade-off: </span>
                {r.tradeOff}
              </p>
              <CopyButton className="mt-3" value={wording} label="Copy response" />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function CopyButton({
  value,
  label,
  className,
  variant = "outline",
  full,
}: {
  value: string;
  label: string;
  className?: string;
  variant?: "outline" | "secondary";
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={cn("rounded-full text-xs", full && "w-full", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("Your browser blocked copying — select the text manually.");
        }
      }}
    >
      {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function Section({
  n,
  title,
  icon,
  children,
}: {
  n: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-rise card-surface p-5" style={{ animationDelay: `${n * 40}ms` }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
