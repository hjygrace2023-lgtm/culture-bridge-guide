/**
 * Structured contract for a CultureLens analysis.
 *
 * AI BACKEND: this is the exact shape a future server-side model call must
 * return (structured output / JSON schema). Keeping the mock engine and the
 * real backend behind the same contract means swapping them touches one file
 * (`src/lib/analysis/engine.ts`) and nothing in the UI.
 */

export type Relationship =
  | "teacher-student"
  | "friends"
  | "colleagues"
  | "manager-employee"
  | "customer-staff"
  | "family"
  | "other";

export type CommunicationFormat =
  | "face-to-face"
  | "text-message"
  | "email"
  | "phone-call"
  | "group-conversation";

export type DesiredOutcome =
  | "understand-meaning"
  | "avoid-conflict"
  | "ask-clarification"
  | "express-disagreement"
  | "apologise"
  | "preserve-relationship"
  | "solve-problem";

/** Every context field is optional on purpose: nationality alone never determines meaning. */
export interface SituationInput {
  situation: string;
  exactWords?: string | undefined;
  myBackground?: string | undefined;
  theirBackground?: string | undefined;
  socialContext?: string | undefined;
  relationship?: Relationship | undefined;
  format?: CommunicationFormat | undefined;
  toneAndBodyLanguage?: string | undefined;
  beforeAfter?: string | undefined;
  desiredOutcome?: DesiredOutcome | undefined;
  responseLanguage?: string | undefined;
}

export type Plausibility = "more-plausible" | "possible" | "requires-more-context";

export interface Interpretation {
  id: string;
  title: string;
  mightHaveMeant: string;
  whyPlausible: string;
  clues: string[];
  plausibility: Plausibility;
}

export type FactorKind = "cultural" | "individual" | "situational";

export interface GapFactor {
  id: string;
  tag: string;
  kind: FactorKind;
  note: string;
}

export type ToneKey = "warmer" | "more-formal" | "more-concise" | "more-direct" | "more-deferential";

export interface ResponseOption {
  id: string;
  style: "gentle" | "direct" | "balanced";
  label: string;
  wording: string;
  /** Alternative wordings keyed by tone adjustment. */
  toneVariants: Partial<Record<ToneKey, string>>;
  likelyEffect: string;
  tradeOff: string;
}

export interface Strategy {
  name: string;
  why: string;
  cautions?: string | undefined;
}

export interface Analysis {
  id: string;
  createdAt: string;
  title: string;
  input: SituationInput;
  /** Shown above everything else when the situation may involve personal safety. */
  safetyNotice?: string | undefined;
  literalMeaning: string;
  interpretations: Interpretation[];
  gapFactors: GapFactor[];
  observed: string[];
  inferred: string[];
  uncertainties: string[];
  wouldHelp: string[];
  strategy: Strategy;
  responses: ResponseOption[];
  clarificationQuestion: string;
}

export interface SavedScenario {
  id: string;
  savedAt: string;
  title: string;
  setting: string;
  mainGap: string;
  strategy: string;
  analysis: Analysis;
}

export const PLAUSIBILITY_LABEL: Record<Plausibility, string> = {
  "more-plausible": "More plausible",
  possible: "Possible",
  "requires-more-context": "Requires more context",
};

export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  "teacher-student": "Teacher – student",
  friends: "Friends",
  colleagues: "Colleagues",
  "manager-employee": "Manager – employee",
  "customer-staff": "Customer – staff",
  family: "Family",
  other: "Other",
};

export const FORMAT_LABEL: Record<CommunicationFormat, string> = {
  "face-to-face": "Face to face",
  "text-message": "Text message",
  email: "Email",
  "phone-call": "Phone call",
  "group-conversation": "Group conversation",
};

export const OUTCOME_LABEL: Record<DesiredOutcome, string> = {
  "understand-meaning": "Understand the meaning",
  "avoid-conflict": "Avoid conflict",
  "ask-clarification": "Ask for clarification",
  "express-disagreement": "Express disagreement",
  apologise: "Apologise",
  "preserve-relationship": "Preserve the relationship",
  "solve-problem": "Solve a practical problem",
};

export const TONE_LABEL: Record<ToneKey, string> = {
  warmer: "Warmer",
  "more-formal": "More formal",
  "more-concise": "More concise",
  "more-direct": "More direct",
  "more-deferential": "More deferential",
};

/**
 * Simplified dropdown option sets used by the UI. The full label maps above stay
 * intact for rendering saved analyses; these short lists keep the form fast to use.
 */
export const RELATIONSHIP_OPTIONS: [string, string][] = [
  ["teacher-student", "Teacher or mentor"],
  ["manager-employee", "Work — manager or colleague"],
  ["friends", "Friend or family"],
  ["other", "Someone else"],
];

export const OUTCOME_OPTIONS: [string, string][] = [
  ["understand-meaning", "Understand what they meant"],
  ["ask-clarification", "Ask for clarification"],
  ["preserve-relationship", "Keep the relationship smooth"],
  ["solve-problem", "Sort out a practical problem"],
];

/** Three tone adjustments instead of five. */
export const TONE_OPTIONS: [ToneKey, string][] = [
  ["warmer", "Warmer"],
  ["more-direct", "More direct"],
  ["more-formal", "More formal"],
];
