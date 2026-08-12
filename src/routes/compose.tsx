import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bubble } from "@/components/chat/bubble";
import { OUTCOME_OPTIONS, type DesiredOutcome } from "@/lib/analysis/types";

export const Route = createFileRoute("/compose")({
  head: () => ({
    meta: [
      { title: "Help me word something — CultureLens" },
      {
        name: "description",
        content: "Shape something you want to say into a few first-person phrasings, each with its trade-off.",
      },
      { property: "og:title", content: "Help me word something — CultureLens" },
      { property: "og:description", content: "Several ways to say it, written as you, with the trade-offs shown." },
    ],
  }),
  component: ComposePage,
});

type Draft = { label: string; text: string; tradeOff: string };

/**
 * AI BACKEND: replace `buildDrafts` with a secure server function returning the
 * same `Draft[]` shape.
 *
 * INSTRUCTION FOR THE MODEL (and for this mock): every draft must be written in
 * the FIRST PERSON, as words the user can send verbatim — always "I ...", never
 * "you could say" or third-person description. No meta-commentary inside `text`.
 */
function buildDrafts(message: string, goal: DesiredOutcome | ""): Draft[] {
  const core = message.trim().replace(/\s+/g, " ").replace(/^(i\s)/i, "I ");
  const goalLine =
    goal === "ask-clarification"
      ? "I'd like to check I've understood you correctly."
      : goal === "solve-problem"
        ? "I'd like us to find a workable next step."
        : goal === "preserve-relationship"
          ? "I value how we work together, so I'd rather say this openly."
          : "I want to make sure I'm reading this the same way you are.";

  return [
    {
      label: "Gentle",
      text: `Thanks for hearing me out. ${goalLine} ${core} If I've misread anything, I'd genuinely like to know.`,
      tradeOff: "Softer — the main point may not land as firmly.",
    },
    {
      label: "Direct",
      text: `${core} ${goalLine}`,
      tradeOff: "Clearest, but can read as more forceful where indirectness is expected.",
    },
    {
      label: "Balanced",
      text: `${core} ${goalLine} Could you let me know how it looks from your side?`,
      tradeOff: "Slightly longer than a short-message style would prefer.",
    },
  ];
}

function ComposePage() {
  const [message, setMessage] = useState("");
  const [goal, setGoal] = useState<DesiredOutcome | "">("");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (message.trim().length < 10) {
      setError("Write a little more — a sentence is enough.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setDrafts(buildDrafts(message, goal));
    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-6 sm:px-5">
      <h1 className="animate-rise font-display text-2xl font-semibold sm:text-3xl">Help me word something</h1>
      <p className="animate-rise mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Say roughly what you mean. You'll get a few versions written as you, ready to send.
      </p>

      <form onSubmit={onSubmit} className="animate-rise mt-5 card-surface space-y-3 p-4" style={{ animationDelay: "60ms" }}>
        <Textarea
          id="message"
          aria-label="What do you want to say?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="e.g. I need the feedback earlier, but I don't want to sound like I'm complaining."
          className="resize-y rounded-xl text-base leading-relaxed sm:text-sm"
        />

        <div>
          <Label className="text-xs font-medium text-muted-foreground">What do you want? · optional</Label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as DesiredOutcome | "")}
            className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring/40 sm:h-10 sm:text-sm"
          >
            <option value="">Just to be understood</option>
            {OUTCOME_OPTIONS.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="h-12 w-full rounded-full text-sm">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting…
            </>
          ) : (
            <>
              <PenLine className="mr-2 h-4 w-4" /> Show me some phrasings
            </>
          )}
        </Button>
      </form>

      {drafts && (
        <div className="mt-5 space-y-3">
          <Bubble side="user">
            <p className="text-sm leading-relaxed">{message.trim()}</p>
          </Bubble>
          {drafts.map((d, i) => (
            <DraftBubble key={d.label} draft={d} delay={i * 70} />
          ))}
          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            Adjust any of these into your own voice before sending.
          </p>
        </div>
      )}
    </div>
  );
}

function DraftBubble({ draft, delay }: { draft: Draft; delay: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <Bubble side="ai" delay={delay}>
      <p className="text-xs font-semibold text-primary">{draft.label}</p>
      <p className="mt-1.5 text-sm leading-relaxed">{draft.text}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{draft.tradeOff}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2.5 rounded-full text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(draft.text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </Bubble>
  );
}
