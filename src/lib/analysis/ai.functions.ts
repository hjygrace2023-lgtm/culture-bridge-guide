/**
 * Real AI analysis, run server-side.
 *
 * The model returns the body of an `Analysis`; the id, timestamp and the
 * original input are attached here so the UI contract stays identical.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateJson, strictObject } from "@/lib/ai/gateway.server";
import type { Analysis, SituationInput } from "./types";
import { FORMAT_LABEL, OUTCOME_LABEL, RELATIONSHIP_LABEL } from "./types";

const InputSchema = z.object({
  situation: z.string().min(10).max(4000),
  exactWords: z.string().max(1000).optional(),
  myBackground: z.string().max(400).optional(),
  theirBackground: z.string().max(400).optional(),
  socialContext: z.string().max(400).optional(),
  relationship: z.string().max(60).optional(),
  format: z.string().max(60).optional(),
  toneAndBodyLanguage: z.string().max(600).optional(),
  beforeAfter: z.string().max(1000).optional(),
  desiredOutcome: z.string().max(60).optional(),
  responseLanguage: z.string().max(60).optional(),
});

const stringArray = { type: "array", items: { type: "string" } };

const SCHEMA = strictObject({
  title: { type: "string" },
  safetyNotice: { type: ["string", "null"] },
  literalMeaning: { type: "string" },
  interpretations: {
    type: "array",
    items: strictObject({
      title: { type: "string" },
      mightHaveMeant: { type: "string" },
      whyPlausible: { type: "string" },
      clues: stringArray,
      plausibility: { type: "string", enum: ["more-plausible", "possible", "requires-more-context"] },
    }),
  },
  gapFactors: {
    type: "array",
    items: strictObject({
      tag: { type: "string" },
      kind: { type: "string", enum: ["cultural", "individual", "situational"] },
      note: { type: "string" },
    }),
  },
  observed: stringArray,
  inferred: stringArray,
  uncertainties: stringArray,
  wouldHelp: stringArray,
  strategy: strictObject({
    name: { type: "string" },
    why: { type: "string" },
    cautions: { type: ["string", "null"] },
  }),
  responses: {
    type: "array",
    items: strictObject({
      style: { type: "string", enum: ["gentle", "direct", "balanced"] },
      label: { type: "string" },
      wording: { type: "string" },
      toneVariants: strictObject({
        warmer: { type: "string" },
        "more-formal": { type: "string" },
        "more-concise": { type: "string" },
        "more-direct": { type: "string" },
        "more-deferential": { type: "string" },
      }),
      likelyEffect: { type: "string" },
      tradeOff: { type: "string" },
    }),
  },
  clarificationQuestion: { type: "string" },
});

const SYSTEM = `You are CultureLens, a careful intercultural communication analyst.

Method rules, which matter more than fluency:
- Never state what people of a nationality or culture "are like". Cultural notes are hedged tendencies that may or may not apply to this person.
- Always separate what was observed from what is being inferred.
- Offer 3 or 4 genuinely different interpretations, ordered most plausible first, and mark each plausibility honestly.
- gapFactors must mix cultural, individual and situational explanations; never attribute everything to culture.
- responses: exactly three, one "gentle", one "direct", one "balanced". Each wording is first-person, ready to send or say as written, with no meta-commentary or brackets.
- toneVariants: rewrite the same message for each listed tone, still ready to send.
- safetyNotice: null unless the situation suggests harassment, discrimination, coercion or personal danger; then one calm sentence suggesting support, no alarmism.
- title: 3-7 words naming the situation, no quotation marks.
- Warm, plain, non-judgemental language. British spelling. Short sentences.`;

function describe(input: SituationInput): string {
  const lines = [`Situation: ${input.situation}`];
  const add = (label: string, value?: string) => {
    if (value && value.trim()) lines.push(`${label}: ${value.trim()}`);
  };
  add("Their exact words", input.exactWords);
  add("Relationship", input.relationship ? RELATIONSHIP_LABEL[input.relationship] : undefined);
  add("Communication format", input.format ? FORMAT_LABEL[input.format] : undefined);
  add("What the user wants", input.desiredOutcome ? OUTCOME_LABEL[input.desiredOutcome] : undefined);
  add("Social or cultural context", input.socialContext);
  add("The user's background", input.myBackground);
  add("The other person's background", input.theirBackground);
  add("Tone and body language", input.toneAndBodyLanguage);
  add("What happened before or after", input.beforeAfter);
  add("Language for suggested responses", input.responseLanguage);
  lines.push("Return the analysis as JSON matching the required schema.");
  return lines.join("\n");
}

type ModelAnalysis = Omit<Analysis, "id" | "createdAt" | "input" | "interpretations" | "gapFactors" | "responses"> & {
  safetyNotice: string | null;
  strategy: { name: string; why: string; cautions: string | null };
  interpretations: Array<Omit<Analysis["interpretations"][number], "id">>;
  gapFactors: Array<Omit<Analysis["gapFactors"][number], "id">>;
  responses: Array<Omit<Analysis["responses"][number], "id">>;
};

export const analyseSituationFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<Analysis> => {
    const input = data as SituationInput;
    const result = await generateJson<ModelAnalysis>({
      system: SYSTEM,
      input: describe(input),
      schemaName: "culturelens_analysis",
      schema: SCHEMA,
    });

    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: result.title,
      input,
      safetyNotice: result.safetyNotice ?? undefined,
      literalMeaning: result.literalMeaning,
      interpretations: result.interpretations.map((i, n) => ({ ...i, id: `interp-${n + 1}` })),
      gapFactors: result.gapFactors.map((g, n) => ({ ...g, id: `gap-${n + 1}` })),
      observed: result.observed,
      inferred: result.inferred,
      uncertainties: result.uncertainties,
      wouldHelp: result.wouldHelp,
      strategy: { name: result.strategy.name, why: result.strategy.why, cautions: result.strategy.cautions ?? undefined },
      responses: result.responses.map((r, n) => ({ ...r, id: `resp-${n + 1}` })),
      clarificationQuestion: result.clarificationQuestion,
    };
  });
