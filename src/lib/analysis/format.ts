import type { Analysis } from "./types";
import { PLAUSIBILITY_LABEL } from "./types";

/** Plain-text export of a full analysis, used by the "Copy full analysis" action. */
export function analysisToText(a: Analysis): string {
  const lines: string[] = [];
  lines.push(`CultureLens analysis — ${a.title}`);
  lines.push(new Date(a.createdAt).toLocaleString());
  lines.push("");
  if (a.safetyNotice) lines.push(`BEFORE GOING FURTHER\n${a.safetyNotice}\n`);

  lines.push("1. WHAT WAS LITERALLY COMMUNICATED");
  lines.push(a.literalMeaning, "");

  lines.push("2. PLAUSIBLE INTERPRETATIONS");
  a.interpretations.forEach((it, i) => {
    lines.push(`${i + 1}) ${it.title} [${PLAUSIBILITY_LABEL[it.plausibility]}]`);
    lines.push(`   Might have meant: ${it.mightHaveMeant}`);
    lines.push(`   Why plausible: ${it.whyPlausible}`);
    it.clues.forEach((c) => lines.push(`   - ${c}`));
  });
  lines.push("");

  lines.push("3. WHAT MAY BE CREATING THE GAP");
  a.gapFactors.forEach((f) => lines.push(`- [${f.kind}] ${f.tag}: ${f.note}`));
  lines.push("");

  lines.push("4. FACTS VERSUS ASSUMPTIONS");
  lines.push("What you observed:");
  a.observed.forEach((o) => lines.push(`- ${o}`));
  lines.push("What you may be inferring:");
  a.inferred.forEach((o) => lines.push(`- ${o}`));
  lines.push("");

  lines.push("5. WHAT REMAINS UNCERTAIN");
  a.uncertainties.forEach((u) => lines.push(`- ${u}`));
  lines.push("What would sharpen this:");
  a.wouldHelp.forEach((w) => lines.push(`- ${w}`));
  lines.push("");

  lines.push("6. RECOMMENDED STRATEGY");
  lines.push(`${a.strategy.name} — ${a.strategy.why}`);
  if (a.strategy.cautions) lines.push(`Caution: ${a.strategy.cautions}`);
  lines.push("");

  lines.push("7. WAYS YOU COULD RESPOND");
  a.responses.forEach((r) => {
    lines.push(`${r.label}`);
    lines.push(`"${r.wording}"`);
    lines.push(`Likely effect: ${r.likelyEffect}`);
    lines.push(`Trade-off: ${r.tradeOff}`);
    lines.push("");
  });

  lines.push("8. BEST CLARIFICATION QUESTION");
  lines.push(a.clarificationQuestion, "");
  lines.push("CultureLens identifies possibilities, not people's definite intentions.");
  return lines.join("\n");
}
