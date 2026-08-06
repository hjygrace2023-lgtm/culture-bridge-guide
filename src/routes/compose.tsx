import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OUTCOME_LABEL, RELATIONSHIP_LABEL, type DesiredOutcome, type Relationship } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compose")({
  head: () => ({
    meta: [
      { title: "Organise language for an output — CultureLens" },
      {
        name: "description",
        content: "Shape something you want to say into several phrasings, each with its likely effect and trade-off.",
      },
      { property: "og:title", content: "Organise language for an output — CultureLens" },
      { property: "og:description", content: "Several ways to say it, with the trade-offs made explicit." },
    ],
  }),
  component: ComposePage,
});

type Draft = { label: string; text: string; effect: string; tradeOff: string };

/**
 * AI BACKEND: replace `buildDrafts` with a secure server function returning the
 * same `Draft[]` shape. Keep the hedged, non-stereotyping register.
 */
function buildDrafts(message: string, relationship: Relationship | "", goal: DesiredOutcome | ""): Draft[] {
  const core = message.trim().replace(/\s+/g, " ");
  const formal = relationship === "manager-employee" || relationship === "teacher-student";
  const opener = formal ? "Thank you for your time." : "Thanks for hearing me out.";
  const goalLine =
    goal === "express-disagreement"
      ? "I see it a little differently, and I'd like to explain why."
      : goal === "apologise"
        ? "I want to acknowledge the effect this had, regardless of what I intended."
        : goal === "solve-problem"
          ? "I'd like to find a workable next step."
          : "I'd like to make sure we're reading this the same way.";

  return [
    {
      label: "Gentle and relationship-preserving",
      text: `${opener} ${goalLine} ${core} If I've misread anything here, I'd genuinely like to know.`,
      effect: "Lowers the temperature and leaves the other person an easy way to add information.",
      tradeOff: "The main point may be softened enough that it is not fully registered.",
    },
    {
      label: "Clear and direct",
      text: `${core} ${goalLine}`,
      effect: "Most likely to be understood exactly as intended, with little room for re-reading.",
      tradeOff: "In settings where indirectness is expected, it may read as more forceful than you mean.",
    },
    {
      label: "Balanced",
      text: `${opener} ${core} ${goalLine} Could you let me know how that looks from your side?`,
      effect: "States the point and invites a reply, which usually keeps the exchange moving.",
      tradeOff: "Longer than necessary if the other person prefers short messages.",
    },
  ];
}

function ComposePage() {
  const [message, setMessage] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [goal, setGoal] = useState<DesiredOutcome | "">("");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (message.trim().length < 10) {
      setError("Write a little more about what you want to say — a sentence is enough.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setDrafts(buildDrafts(message, relationship, goal));
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-8">
      <div className="animate-rise">
        <h1 className="font-display text-3xl font-semibold">Organise your language</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Say what you want to get across, roughly. CultureLens will offer a few phrasings and make the trade-offs
          visible so you can pick the one that matches your goal.
        </p>
      </div>

      <form onSubmit={onSubmit} className="animate-rise mt-6 card-surface space-y-4 p-5" style={{ animationDelay: "80ms" }}>
        <div>
          <Label htmlFor="message" className="text-sm font-semibold">
            What do you want to say?
          </Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="e.g. I need the feedback earlier than the current schedule allows, but I don't want to sound like I'm complaining."
            className="mt-2 resize-y rounded-xl text-sm leading-relaxed"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Relationship · optional</Label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as Relationship | "")}
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="">Not specified</option>
              {Object.entries(RELATIONSHIP_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Your goal · optional</Label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as DesiredOutcome | "")}
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="">Not specified</option>
              {Object.entries(OUTCOME_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="h-11 w-full rounded-full text-sm">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting options…
            </>
          ) : (
            <>
              <PenLine className="mr-2 h-4 w-4" /> Offer me some phrasings
            </>
          )}
        </Button>
      </form>

      {drafts && (
        <div className="mt-5 space-y-3">
          {drafts.map((d, i) => (
            <DraftCard key={d.label} draft={d} delay={i * 70} />
          ))}
          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            Wording that works in one setting may land differently in another. Adjust it in your own voice.
          </p>
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft, delay }: { draft: Draft; delay: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <article className={cn("animate-rise card-surface p-5")} style={{ animationDelay: `${delay}ms` }}>
      <h2 className="text-sm font-semibold">{draft.label}</h2>
      <p className="mt-2 rounded-xl bg-muted/70 p-3 text-sm leading-relaxed">{draft.text}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Likely effect: </span>
        {draft.effect}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Trade-off: </span>
        {draft.tradeOff}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 rounded-full text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(draft.text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </article>
  );
}
