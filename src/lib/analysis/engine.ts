import type { Analysis, SituationInput } from "./types";
import { analyseSituationFn } from "./ai.functions";

/**
 * Single entry point for producing an analysis.
 *
 * Calls a server function that talks to the AI gateway; the API key stays
 * server-side. The returned shape is the `Analysis` contract in `./types`,
 * so the UI needs no knowledge of the backend.
 */
export async function analyseSituation(input: SituationInput): Promise<Analysis> {
  return analyseSituationFn({ data: input });
}
