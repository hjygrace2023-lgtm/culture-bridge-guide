import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bubble } from "@/components/ui/bubble";
import { CultureContextChip } from "@/components/culture/context-chip";
import { useCultureContext } from "@/lib/culture/store";
import { RELATIONSHIP_LABEL, type Relationship } from "@/lib/analysis/types";
import {
  composeDrafts,
  inferFormat,
  FORMAT_CHIP_LABEL,
  type ComposeDraft,
  type ComposeFormat,
  type ComposeMode,
} from "@/lib/compose/mock-compose";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compose")({
  head: () => ({
    meta: [
      { title: "Organise language for an output — CultureLens" },
      {
        name: "description",
        content: "Shape a request or a reply into several phrasings, each with its likely effect and trade-off.",
      },
      { property: "og:title", content: "Organise language for an output — CultureLens" },
      { property: "og:description", content: "Several ways to say it, with the trade-offs made explicit." },
    ],
  }),
  component: ComposePage,
});

const FORMATS: ComposeFormat[] = ["email", "text", "in-person"];

function ComposePage() {
  const { culture } = useCultureContext();
  const [mode, setMode] = useState<ComposeMode>("request");
  const [intent, setIntent] = useState("");
  const [theirMessage, setTheirMessage] = useState("");
  const [relationship, setRelationship] = useState<Relationship | "">("");
  const [customRelationship, setCustomRelationship] = useState("");
  const [format, setFormat] = useState<ComposeFormat>("text");
  const [formatTouched, setFormatTouched] = useState(false);
  const [drafts, setDrafts] = useState<ComposeDraft[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSubmitted = useRef<{ mode: ComposeMode; intent: string; theirMessage: string } | null>(null);

  const guess = useMemo(
    () => inferFormat({ intent, relationship, ...(mode === "reply" ? { theirMessage } : {}) }),
    [intent, theirMessage, relationship, mode],
  );

  useEffect(() => {
    if (!formatTouched) setFormat(guess.format);
  }, [guess.format, formatTouched]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (intent.trim().length < 10) {
      setError(
        mode === "request"
          ? "Tell me a little more about what you'd like to request — a sentence is enough."
          : "Tell me a little more about what your reply should get across.",
      );
      return;
    }
    if (mode === "reply" && theirMessage.trim().length < 3) {
      setError("Paste or summarise the message you received, so the reply can respond to it.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setDrafts(
      composeDrafts({
        mode,
        intent,
        theirMessage,
        relationship,
        customRelationship,
        format,
        culture,
      }),
    );
    lastSubmitted.current = { mode, intent, theirMessage };
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-8">
      <div className="animate-rise flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Organise your language</h1>
        <CultureContextChip />
      </div>

      {/* Segmented control: the two modes are the primary division of this page. */}
      <div
        role="tablist"
        aria-label="Composition mode"
        className="animate-rise mt-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/60 p-1"
      >
        {(["request", "reply"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setDrafts(null);
            }}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-medium transition-colors",
              mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "request" ? "Make a request" : "Reply to someone"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="animate-rise mt-4 card-surface space-y-4 p-5" style={{ animationDelay: "60ms" }}>
        {mode === "reply" && (
          <div>
            <Label htmlFor="theirs" className="text-sm font-semibold">
              What they said to you
            </Label>
            <Textarea
              id="theirs"
              value={theirMessage}
              onChange={(e) => setTheirMessage(e.target.value)}
              rows={3}
              placeholder="Paste their message, or summarise it."
              className="mt-2 resize-y rounded-xl text-sm leading-relaxed"
            />
          </div>
        )}

        <div>
          <Label htmlFor="intent" className="text-sm font-semibold">
            {mode === "request" ? "What do you want to request?" : "What should your reply get across?"}
          </Label>
          <Textarea
            id="intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={mode === "reply" ? 3 : 5}
            placeholder={
              mode === "request"
                ? "e.g. I need the feedback a week earlier than the current schedule."
                : "e.g. I can't take on the extra shift, but I don't want to sound unwilling."
            }
            className="mt-2 resize-y rounded-xl text-sm leading-relaxed"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Relationship</Label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as Relationship | "")}
              className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="">Not specified</option>
              {Object.entries(RELATIONSHIP_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {k === "other" ? "Other (describe it)" : v}
                </option>
              ))}
            </select>
            {relationship === "other" && (
              <Input
                value={customRelationship}
                onChange={(e) => setCustomRelationship(e.target.value)}
                placeholder="e.g. my landlord, my host family"
                aria-label="Describe the relationship"
                className="mt-2 h-11 rounded-xl text-sm"
              />
            )}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Format {guess.confident ? "· inferred" : "· best guess, please check"}
            </Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFormat(f);
                    setFormatTouched(true);
                  }}
                  aria-pressed={format === f}
                  className={cn(
                    "min-h-10 rounded-full border px-3.5 text-xs font-medium transition-colors",
                    format === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {FORMAT_CHIP_LABEL[f]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="h-12 w-full rounded-full text-sm">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting options…
            </>
          ) : (
            <>
              <PenLine className="mr-2 h-4 w-4" /> {mode === "request" ? "Word my request" : "Word my reply"}
            </>
          )}
        </Button>
      </form>

      {drafts && (
        <div className="mt-5 space-y-3">
          {mode === "reply" && lastSubmitted.current?.theirMessage.trim() && (
            <Bubble side="assistant" label="They said">
              {lastSubmitted.current.theirMessage.trim()}
            </Bubble>
          )}
          {drafts.map((d, i) => (
            <DraftCard key={d.id} draft={d} delay={i * 70} />
          ))}
          <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
            Wording that works in one setting may land differently in another. Adjust it in your own voice.
          </p>
        </div>
      )}
    </div>
  );
}

function DraftCard({ draft, delay }: { draft: ComposeDraft; delay: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <article className="animate-rise space-y-2" style={{ animationDelay: `${delay}ms` }}>
      <Bubble side="user" label={draft.label}>
        {draft.text}
      </Bubble>
      <div className="ml-auto max-w-[92%] rounded-xl bg-muted/60 px-3.5 py-2.5 sm:max-w-[85%]">
        <p className="text-xs leading-relaxed text-muted-foreground">
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
          className="mt-2.5 min-h-9 rounded-full text-xs"
          onClick={async () => {
            await navigator.clipboard.writeText(draft.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </article>
  );
}
