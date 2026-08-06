import type { Analysis, SituationInput } from "./types";
import { runMockAnalysis } from "./mock-engine";

/**
 * Single entry point for producing an analysis.
 *
 * AI BACKEND: when a real model is connected, replace the body of
 * `analyseSituation` with a call to a secure server function, e.g.
 *
 *   const analysis = await analyseSituationServerFn({ data: input });
 *
 * The server function should request structured output matching `Analysis`
 * from `./types`, and hold the API key server-side only. The UI needs no
 * changes because the contract is identical.
 */
export async function analyseSituation(input: SituationInput): Promise<Analysis> {
  // Simulated latency so loading states are exercised realistically.
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return runMockAnalysis(input);
}
