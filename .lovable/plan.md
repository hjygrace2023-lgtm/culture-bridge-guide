# Plan: show AI wiring, finish login, simplify UI

## Where the real AI code exists now

The server-only AI gateway is here:

```ts
// src/lib/ai/gateway.server.ts
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
export const AI_MODEL = "openai/gpt-6-astra";

export async function generateJson<T>(args: {
  system: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiGatewayError(401, "Missing LOVABLE_API_KEY");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      instructions: args.system,
      input: args.input,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: args.schemaName,
          strict: true,
          schema: args.schema,
        },
      },
    }),
  });
```

Analyse calls that gateway here:

```ts
// src/lib/analysis/ai.functions.ts
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
      ...
    };
  });
```

Compose calls the same gateway here:

```ts
// src/lib/compose/ai.functions.ts
export const composeDraftsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ComposeDraft[]> => {
    const result = await generateJson<{ drafts: Array<{ label: string; text: string; effect: string; tradeOff: string }> }>({
      system: SYSTEM,
      input: lines.join("\n"),
      schemaName: "culturelens_drafts",
      schema: SCHEMA,
    });

    return result.drafts.map((d, n) => ({
      id: `draft-${n + 1}`,
      label: d.label,
      text: d.text,
      effect: d.effect,
      tradeOff: d.tradeOff,
    }));
  });
```

The browser entry point for Analyse now uses the server function through:

```ts
// src/lib/analysis/engine.ts
export async function analyseSituation(input: SituationInput): Promise<Analysis> {
  return analyseSituationFn({ data: input });
}
```

The AI key is read only on the server with `process.env["LOVABLE_API_KEY"]`. It is not in frontend code.

## What I will finish next

1. Enable accounts and signed-in history with Lovable Cloud.
2. Add a simple login page with email/password sign up and sign in, plus a Google sign-in option if available.
3. Add a lightweight profile area for display name and profile picture.
4. Keep the app fully usable when signed out.
5. Save Analyse and Compose history for signed-in users, while keeping local saved scenarios for signed-out users.
6. Remove the four-colour ribbon/track decoration from page headings.
7. Simplify the current design: fewer descriptions, quieter headings, fewer large decorative blocks, cleaner buttons/forms.
8. Restyle Result, Review, Saved, About, Analyse and Compose consistently with the simplified poster/editorial direction.
9. Verify the core pages on desktop and phone width.

## Technical details

- Use Lovable Cloud for auth, profile data, profile picture storage, and signed-in history.
- Use server-side auth checks for account-owned data.
- Do not store roles on user/profile rows.
- Keep AI calls server-side and continue using the current `generateJson` seam.
- Preserve every existing route and workflow.
