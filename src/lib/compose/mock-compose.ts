/**
 * Mocked composition engine.
 *
 * AI BACKEND: replace `composeDrafts` with a server function returning the same
 * `ComposeDraft[]` shape. Everything below is deterministic string assembly so
 * the UI flow can be demonstrated without any key or network call.
 *
 * Register rules kept here on purpose:
 *  - output is always first person, ready to send or say — never meta-advice
 *  - cultural context only ever softens/adjusts register; it never asserts what
 *    a person from a place is like
 */
import { noteForCulture } from "@/lib/culture/store";
import { RELATIONSHIP_LABEL, type Relationship } from "@/lib/analysis/types";

export type ComposeMode = "request" | "reply";
export type ComposeFormat = "email" | "text" | "in-person";

export const FORMAT_CHIP_LABEL: Record<ComposeFormat, string> = {
  email: "Email",
  text: "Text",
  "in-person": "In person",
};

export interface ComposeInput {
  mode: ComposeMode;
  /** Request mode: what they want to ask for. Reply mode: what the reply should convey. */
  intent: string;
  /** Reply mode only: the message received. */
  theirMessage?: string;
  relationship: Relationship | "";
  /** Free text used when relationship is "other". */
  customRelationship?: string;
  format: ComposeFormat;
  culture: string | null;
}

export interface ComposeDraft {
  id: string;
  label: string;
  text: string;
  effect: string;
  tradeOff: string;
}

const FORMAL: Relationship[] = ["manager-employee", "teacher-student", "customer-staff"];

function relationshipName(input: ComposeInput): string {
  if (input.relationship === "other") return input.customRelationship?.trim() || "the other person";
  return input.relationship ? RELATIONSHIP_LABEL[input.relationship].toLowerCase() : "the other person";
}

function greeting(input: ComposeInput, formal: boolean): string {
  if (input.format === "email") return formal ? "Dear colleague," : "Hi,";
  if (input.format === "text") return formal ? "Hello," : "Hi —";
  return formal ? "Thank you for making time." : "Hey, quick one —";
}

function closing(input: ComposeInput, formal: boolean): string {
  if (input.format === "email") return formal ? "Thank you for your time." : "Thanks!";
  if (input.format === "text") return formal ? "Thank you." : "Thanks!";
  return formal ? "Thank you." : "Thanks a lot.";
}

function tidy(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  return /[.?!]$/.test(t) ? t : `${t}.`;
}

function cultureLine(input: ComposeInput, register: "soft" | "direct" | "balanced"): string {
  if (!input.culture) return "";
  const hedged = noteForCulture(input.culture);
  if (register === "direct") return "";
  if (register === "soft") {
    return hedged
      ? `I may be missing something about how this is usually handled here, so please tell me if a different approach would work better.`
      : `If there's a more usual way to handle this here, I'm happy to follow it.`;
  }
  return `Please let me know if there's a more usual way to do this here.`;
}

export function composeDrafts(input: ComposeInput): ComposeDraft[] {
  const formal = FORMAL.includes(input.relationship as Relationship);
  const who = relationshipName(input);
  const core = tidy(input.intent);
  const theirs = tidy(input.theirMessage ?? "");
  const hi = greeting(input, formal);
  const bye = closing(input, formal);

  const ack =
    input.mode === "reply"
      ? theirs
        ? `Thank you for your message about ${shorten(theirs)}`
        : "Thank you for getting back to me."
      : "";

  const asking = input.mode === "request";

  const gentle = [
    hi,
    asking ? `I hope this is a reasonable moment to ask.` : `${ack}`,
    asking
      ? `Would it be possible for you to help with this: ${lower(core)}`
      : `Here's where I stand: ${lower(core)}`,
    cultureLine(input, "soft"),
    asking ? `If that isn't workable, I completely understand.` : `If I've read anything the wrong way, I'd like to know.`,
    bye,
  ];

  const direct = [
    input.format === "in-person" ? "" : hi,
    asking ? `I'd like to ask for something: ${lower(core)}` : `${theirs ? "Thanks for your message." : ""} ${core}`,
    asking ? `Could you let me know by the end of the week whether that works?` : `Let me know what you think.`,
    input.format === "email" ? bye : "",
  ];

  const balanced = [
    hi,
    input.mode === "reply" ? ack : "",
    asking ? `I wanted to ask about something. ${core}` : core,
    cultureLine(input, "balanced"),
    asking ? `Would that be possible from your side?` : `Does that match how you see it?`,
    bye,
  ];

  const settingSuffix = input.culture ? ` in a ${input.culture} setting` : "";
  const formatWord = FORMAT_CHIP_LABEL[input.format].toLowerCase();

  return [
    {
      id: "gentle",
      label: "Gentle",
      text: join(gentle),
      effect: `Leaves ${who} an easy way to decline or add information, which often helps${settingSuffix}.`,
      tradeOff: "The main point can be softened enough that it isn't fully registered.",
    },
    {
      id: "direct",
      label: "Direct",
      text: join(direct),
      effect: `Short enough for a ${formatWord} and hard to misread.`,
      tradeOff: `Where indirectness is expected${settingSuffix}, this may read as firmer than you intend.`,
    },
    {
      id: "balanced",
      label: "Balanced",
      text: join(balanced),
      effect: "States the point and invites a reply, which usually keeps the exchange moving.",
      tradeOff: `Longer than a ${formatWord} sometimes calls for.`,
    },
  ];
}

function join(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function lower(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function shorten(text: string): string {
  const t = text.replace(/[.?!]$/, "");
  return t.length > 60 ? `${t.slice(0, 60).trim()}…` : t;
}

/** Best-effort format guess; the UI always shows it as a correctable chip. */
export function inferFormat(input: { theirMessage?: string; intent: string; relationship: Relationship | "" }): {
  format: ComposeFormat;
  confident: boolean;
} {
  const blob = `${input.theirMessage ?? ""} ${input.intent}`.toLowerCase();
  if (/\b(email|e-mail|inbox|subject line|cc|reply-all|wrote to me)\b/.test(blob)) return { format: "email", confident: true };
  if (/\b(text|texted|whatsapp|message|dm|chat|sms)\b/.test(blob)) return { format: "text", confident: true };
  if (/\b(said|told me|in person|face to face|meeting|corridor|classroom|asked me)\b/.test(blob))
    return { format: "in-person", confident: true };
  if (input.relationship === "manager-employee" || input.relationship === "teacher-student")
    return { format: "email", confident: false };
  return { format: "text", confident: false };
}
