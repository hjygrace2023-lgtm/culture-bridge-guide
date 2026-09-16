/**
 * Real AI composition, run server-side. Returns the same `ComposeDraft[]`
 * shape the UI already renders.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateJson, strictObject } from "@/lib/ai/gateway.server";
import { RELATIONSHIP_LABEL, type Relationship } from "@/lib/analysis/types";
import { FORMAT_CHIP_LABEL, type ComposeDraft, type ComposeFormat, type ComposeMode } from "./mock-compose";

const InputSchema = z.object({
  mode: z.enum(["request", "reply"]),
  intent: z.string().min(5).max(2000),
  theirMessage: z.string().max(2000).optional(),
  relationship: z.string().max(60).optional(),
  customRelationship: z.string().max(120).optional(),
  format: z.enum(["email", "text", "in-person"]),
  culture: z.string().max(120).nullable().optional(),
});

const SCHEMA = strictObject({
  drafts: {
    type: "array",
    items: strictObject({
      label: { type: "string", enum: ["Gentle", "Direct", "Balanced"] },
      text: { type: "string" },
      effect: { type: "string" },
      tradeOff: { type: "string" },
    }),
  },
});

const SYSTEM = `You write ready-to-use wording for intercultural communication.

Rules:
- Produce exactly three drafts, in this order: Gentle, Direct, Balanced.
- Each "text" is first person and ready to send or say verbatim: no placeholders, brackets, meta-advice or explanation inside it.
- Match the stated format: an email may have a greeting and sign-off; a text message is short; in person is spoken and natural.
- Cultural setting may only adjust register and politeness. Never assert what people from a place are like.
- "effect" is one hedged sentence on how it is likely to land. "tradeOff" is one honest sentence on what it costs.
- Warm, plain, respectful. British spelling.`;

export const composeDraftsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ComposeDraft[]> => {
    const who =
      data.relationship === "other"
        ? data.customRelationship?.trim() || "the other person"
        : data.relationship
          ? RELATIONSHIP_LABEL[data.relationship as Relationship]
          : "an unspecified relationship";

    const lines = [
      data.mode === "request"
        ? `The user wants to make a request: ${data.intent}`
        : `The user needs to reply. What the reply should get across: ${data.intent}`,
    ];
    if (data.mode === "reply" && data.theirMessage?.trim()) {
      lines.push(`The message they received: ${data.theirMessage.trim()}`);
    }
    lines.push(`Relationship to the other person: ${who}`);
    lines.push(`Format: ${FORMAT_CHIP_LABEL[data.format as ComposeFormat]}`);
    if (data.culture) lines.push(`Cultural setting the user selected: ${data.culture}`);
    lines.push("Return three drafts as JSON matching the required schema.");

    const result = await generateJson<{ drafts: Array<{ label: string; text: string; effect: string; tradeOff: string }> }>(
      {
        system: SYSTEM,
        input: lines.join("\n"),
        schemaName: "culturelens_drafts",
        schema: SCHEMA,
      },
    );

    return result.drafts.map((d, n) => ({
      id: `draft-${n + 1}`,
      label: d.label,
      text: d.text,
      effect: d.effect,
      tradeOff: d.tradeOff,
    }));
  });

export type { ComposeMode };
