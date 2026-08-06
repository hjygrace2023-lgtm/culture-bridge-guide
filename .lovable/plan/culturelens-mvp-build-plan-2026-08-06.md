# CultureLens — MVP build plan

An AI cultural translator that separates literal meaning from implied meaning, offers several plausible interpretations instead of certainty, and helps the user choose a response that matches their goal. Non-stereotyping and probabilistic by design.

## Scope decided

- Name shown in the UI: **CultureLens**
- Analysis engine: **mocked** but shaped exactly like a future structured AI response, with clearly commented hand-off points. No API key anywhere.
- Region search: shows a short, carefully-hedged communication-tendencies note **and** offers a button that starts an analysis with that context prefilled.

## Pages

**Home (`/`)** — Warm greeting tagline, primary buttons "Analyse a situation" and "Organise language for an output", secondary "Try an example", the three-step explainer (Describe / Explore / Choose), and the disclaimer "CultureLens identifies possibilities, not people's definite intentions." Top bar holds the country/region search; bottom bar is the app-wide nav.

**Analyser (`/analyse`)** — Required "What happened?" textarea with the teacher-and-grade placeholder. Collapsible "Add context" with all optional fields: exact words, both communication backgrounds, country/social context, relationship, format, tone/body language, before/after, desired outcome, preferred response language. Validation, loading state, privacy note ("stays in your browser").

**Results (`/analyse/result`)** — Eight sections as cards: literal meaning; 3–5 interpretation cards with plausibility labels (no fake percentages); communication-gap factor tags split into cultural vs individual vs situational; a two-column facts-vs-assumptions table; what remains uncertain plus what extra info would help; one recommended strategy with reasoning; three response drafts (gentle / direct / balanced) each with likely effect, trade-off and copy button, plus tone adjusters (warmer, more formal, more concise, more direct, more deferential); and one neutral clarification question. Footer actions: edit and re-analyse, copy full analysis, save scenario, start new.

**Organise language (`/compose`)** — Lighter surface: paste what you want to say, pick goal, relationship and tone, get several phrasings with trade-offs.

**Saved (`/saved`)** — localStorage scenarios, each showing short title, date, relationship/setting, main gap category and recommended strategy; reopen or delete. Includes a **flashcard quiz mode**: flip a saved situation to reveal its interpretations and recommended response, with next/prev and shuffle so users can revisit and practise.

**About (`/about`)** — The intercultural conflict-resolution principles behind the app, the caveat that strategies don't transfer identically across situations, and the single real reference (nature.com/articles/s41599-025-04391-0). No invented sources.

## Safety behaviour

Built into the mock generator and copy, not bolted on: probabilistic phrasing only; no absolute claims about any group; no culture ranking; no personality diagnosis; power imbalance is flagged and confrontational advice suppressed. A keyword check on the situation text (threats, harassment, discrimination, violence, safety) surfaces a calm support banner recommending a trusted person or professional support, ahead of the analysis.

## Visual design

Warm off-white canvas, teal accent, bright-but-quiet secondary hues, soft shadows, generous rounded corners, clear typographic hierarchy. Restrained micro-animations (card stagger on results, smooth accordion, gentle button/press feedback). Accessible contrast, responsive from mobile up. No gradients-everywhere, no emoji, no flags, no decorative illustrations.

## Technical notes

- Design tokens in `src/styles.css`; no hardcoded colour utilities.
- Routes under `src/routes/`; bottom nav and top bar in the root layout; each route gets its own head metadata.
- `src/lib/analysis/types.ts` — the structured `Analysis` contract. `src/lib/analysis/mock-engine.ts` — deterministic realistic generator keyed off the input, with a `// AI BACKEND: replace this call with a server function returning the same shape` comment at the seam. A single `analyseSituation()` entry point so swapping in a server function touches one file.
- Optional context fields are all nullable; every renderer degrades gracefully when they're missing.
- Saved scenarios via a small `useSavedScenarios` hook over localStorage, SSR-safe.
- Reusable components: `SectionCard`, `InterpretationCard`, `FactorTag`, `ResponseCard`, `Flashcard`, `RegionSearch`, `ContextAccordion`.
