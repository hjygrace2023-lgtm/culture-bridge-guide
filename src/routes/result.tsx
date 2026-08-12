import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, HelpCircle, Plus, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleTitle } from "@/components/chat/bubble";
import { getCurrentAnalysis, useSavedScenarios } from "@/lib/analysis/storage";
import { analysisToText } from "@/lib/analysis/format";
import { PLAUSIBILITY_LABEL, TONE_OPTIONS, type Analysis, type ToneKey } from "@/lib/analysis/types";
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
  const [showDetail, setShowDetail] = useState(false);
  const { save } = useSavedScenarios();
  const navigate = useNavigate();

  useEffect(() => {
    setAnalysis(getCurrentAnalysis());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-3 px-4 pt-8 sm:px-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mx-auto max-w-sm px-5 pt-20 text-center">
        <h1 className="font-display text-2xl font-semibold">No analysis open</h1>
        <p className="mt-2 text-sm text-muted-foreground">Describe a situation and the readings will appear here.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/analyse">Analyse a situation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-4 pb-8 pt-6 sm:px-5">
      <Bubble side="user">
        <p className="text-sm leading-relaxed">{analysis.input.situation}</p>
      </Bubble>

      {analysis.safetyNotice && (
        <Bubble side="ai" className="border-clay-foreground/25 bg-clay/70 text-clay-foreground">
          <BubbleTitle icon={<AlertTriangle className="h-4 w-4" />}>Before going further</BubbleTitle>
          <p className="mt-1.5 text-xs leading-relaxed">{analysis.safetyNotice}</p>
        </Bubble>
      )}

      <Bubble side="ai" delay={60}>
        <BubbleTitle>What was literally said</BubbleTitle>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{analysis.literalMeaning}</p>
      </Bubble>

      <Bubble side="ai" delay={120}>
        <BubbleTitle>What it might have meant</BubbleTitle>
        <div className="mt-2 space-y-2.5">
          {analysis.interpretations.map((it) => (
            <div key={it.id} className="rounded-xl bg-muted/60 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{it.title}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    it.plausibility === "more-plausible" && "bg-sage text-sage-foreground",
                    it.plausibility === "possible" && "bg-sand text-sand-foreground",
                    it.plausibility === "requires-more-context" && "bg-lilac text-lilac-foreground",
                  )}
                >
                  {PLAUSIBILITY_LABEL[it.plausibility]}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.mightHaveMeant}</p>
              {showDetail && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{it.whyPlausible}</p>
              )}
            </div>
          ))}
        </div>
      </Bubble>

      <Bubble side="ai" delay={180}>
        <BubbleTitle>What you could do</BubbleTitle>
        <p className="mt-1.5 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {analysis.strategy.name}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{analysis.strategy.why}</p>
        <ResponseList analysis={analysis} />
      </Bubble>

      <Bubble side="ai" delay={240}>
        <BubbleTitle icon={<HelpCircle className="h-4 w-4" />}>One question you could ask</BubbleTitle>
        <p className="mt-2 rounded-xl bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground">
          {analysis.clarificationQuestion}
        </p>
        <CopyButton className="mt-2.5" value={analysis.clarificationQuestion} label="Copy question" />
      </Bubble>

      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="mx-auto block rounded-full px-4 py-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {showDetail ? "Hide the detailed breakdown" : "Show the detailed breakdown"}
      </button>

      {showDetail && (
        <>
          <Bubble side="ai">
            <BubbleTitle>What may be creating the gap</BubbleTitle>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {analysis.gapFactors.map((f) => (
                <span key={f.id} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                  {f.tag}
                </span>
              ))}
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {analysis.gapFactors.map((f) => (
                <li key={f.id} className="text-xs leading-relaxed text-muted-foreground">
                  · {f.note}
                </li>
              ))}
            </ul>
          </Bubble>

          <Bubble side="ai">
            <BubbleTitle>Facts, assumptions and open questions</BubbleTitle>
            <List title="Observed" items={analysis.observed} />
            <List title="Inferred" items={analysis.inferred} />
            <List title="Still uncertain" items={analysis.uncertainties} />
            <List title="What would sharpen this" items={analysis.wouldHelp} />
          </Bubble>
        </>
      )}

      <div className="grid gap-2 pt-1 sm:grid-cols-2">
        <Button
          className="h-11 rounded-full"
          onClick={() => {
            save(analysis);
            toast.success("Saved to this browser");
          }}
        >
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
        <Button variant="secondary" className="h-11 rounded-full" onClick={() => navigate({ to: "/analyse" })}>
          <Plus className="mr-1.5 h-4 w-4" /> New scenario
        </Button>
        <Button asChild variant="ghost" className="h-11 rounded-full text-xs text-muted-foreground">
          <Link to="/analyse" search={{ edit: true }}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Edit and re-analyse
          </Link>
        </Button>
        <CopyButton value={analysisToText(analysis)} label="Copy full analysis" variant="ghost" full />
      </div>

      <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
        CultureLens identifies possibilities, not people's definite intentions.
      </p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold">{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs leading-relaxed text-muted-foreground">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResponseList({ analysis }: { analysis: Analysis }) {
  const [tone, setTone] = useState<ToneKey | null>(null);

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {TONE_OPTIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTone((t) => (t === key ? null : key))}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              tone === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2.5">
        {analysis.responses.map((r) => {
          const wording = (tone && r.toneVariants[tone]) || r.wording;
          return (
            <div key={r.id} className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs font-semibold text-primary">{r.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed">{wording}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{r.tradeOff}</p>
              <CopyButton className="mt-2" value={wording} label="Copy" />
            </div>
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
  variant?: "outline" | "secondary" | "ghost";
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={cn("rounded-full text-xs", full && "h-11 w-full", className)}
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
