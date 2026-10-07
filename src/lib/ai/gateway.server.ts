/**
 * Server-only Lovable AI Gateway helper.
 *
 * All model calls go through here so the API key never leaves the server.
 * Uses the Chat Completions API with strict structured output, always
 * streaming (buffered calls can get cut off).
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const AI_MODEL = "google/gemini-3.8-flash";

export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AiGatewayError";
  }
}

function friendlyMessage(status: number, raw: string): string {
  if (status === 429) return "The analyser is busy right now. Please try again in a moment.";
  if (status === 402) return "The AI workspace is out of credits. Please top up to continue.";
  if (status === 403) return "AI access is currently blocked for this workspace.";
  if (status === 401) return "The AI service is not configured correctly.";
  return raw || "The AI service could not complete this request.";
}

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
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.input },
      ],
      stream: true,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: args.schemaName,
          strict: true,
          schema: args.schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let detail = body;
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
      detail = parsed.error?.message ?? parsed.message ?? body;
    } catch {
      /* keep raw text */
    }
    throw new AiGatewayError(res.status, friendlyMessage(res.status, detail));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
        };
        const delta = event.choices?.[0]?.delta?.content;
        if (typeof delta === "string") text += delta;
      } catch {
        /* ignore keep-alive / partial frames */
      }
    }
  }

  if (!text.trim()) {
    throw new AiGatewayError(502, "The AI service returned an empty response. Please try again.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiGatewayError(502, "The AI service returned an unreadable response. Please try again.");
  }
}

/** Helper for strict JSON schema objects: every property required, no extras. */
export function strictObject(properties: Record<string, unknown>): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}
