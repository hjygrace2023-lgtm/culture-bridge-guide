import type {
  Analysis,
  GapFactor,
  Interpretation,
  ResponseOption,
  SituationInput,
  Strategy,
} from "./types";
import { RELATIONSHIP_LABEL } from "./types";

/**
 * MOCK ANALYSIS ENGINE
 * --------------------
 * Produces a realistic, non-stereotyping analysis so the full flow can be
 * tested without any API key. Every string here is deliberately probabilistic:
 * no absolute claims about nationalities or groups, no personality diagnosis,
 * no numerical confidence.
 *
 * AI BACKEND: replace `runMockAnalysis` with a call to a secure server-side
 * function that returns the same `Analysis` shape (structured output). The API
 * key must live only on the server — never in this file or any client bundle.
 */

const SAFETY_PATTERNS =
  /\b(threat|threaten|harass|harassment|stalk|assault|violence|violent|abuse|abusive|hit me|discriminat|racist|racism|sexist|slur|unsafe|scared for my safety|hurt me)\b/i;

const SAFETY_NOTICE =
  "Parts of this description mention behaviour that may affect your safety or dignity. CultureLens is not a safety service and cannot judge intent. If any of this involves threats, harassment, discrimination or violence, please talk to someone you trust, or to a counsellor, HR, student services, or local support services. You do not have to resolve it through better phrasing alone.";

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function titleFrom(input: SituationInput) {
  const raw = input.situation.trim().replace(/\s+/g, " ");
  const firstSentence = raw.split(/(?<=[.!?])\s/)[0] ?? raw;
  const short = firstSentence.length > 62 ? `${firstSentence.slice(0, 59).trim()}…` : firstSentence;
  return short || "Untitled situation";
}

function settingFrom(input: SituationInput) {
  const parts = [
    input.relationship ? RELATIONSHIP_LABEL[input.relationship] : undefined,
    input.socialContext,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Setting not specified";
}

const POWER_GAP = new Set(["teacher-student", "manager-employee", "customer-staff"]);

/* ---------------------------------------------------------------- factors */

function buildFactors(input: SituationInput): GapFactor[] {
  const factors: GapFactor[] = [
    {
      id: "directness",
      tag: "Direct vs indirect communication",
      kind: "cultural",
      note: "The message may carry meaning through implication rather than explicit statement. In some settings a reassuring phrase does the work that a direct answer would do elsewhere.",
    },
    {
      id: "face",
      tag: "Face-saving",
      kind: "cultural",
      note: "The speaker may be protecting your comfort, their own position, or both, by keeping the wording soft and open.",
    },
  ];

  if (input.relationship && POWER_GAP.has(input.relationship)) {
    factors.push({
      id: "hierarchy",
      tag: "Hierarchy or power distance",
      kind: "situational",
      note: `In a ${RELATIONSHIP_LABEL[input.relationship].toLowerCase()} relationship, one person usually controls what information can be shared and when. That constraint can shape wording independently of any personal attitude towards you.`,
    });
    factors.push({
      id: "rules",
      tag: "Institutional rules",
      kind: "situational",
      note: "There may be a policy, deadline or confidentiality rule that limits what the other person is allowed to say, even if they would like to say more.",
    });
  }

  if (input.format && input.format !== "face-to-face") {
    factors.push({
      id: "channel",
      tag: "Formality and channel",
      kind: "situational",
      note: "Written and remote formats strip out tone, pauses and expression, so short replies can read as colder than they were meant.",
    });
  } else {
    factors.push({
      id: "body",
      tag: "Gesture or body language",
      kind: "situational",
      note: "Non-verbal signals carry a lot of the meaning in person, and the same gesture can be read very differently by two people.",
    });
  }

  if (input.myBackground || input.theirBackground) {
    factors.push({
      id: "language",
      tag: "Language or idiom",
      kind: "cultural",
      note: "If the exchange happened in a second language for either person, a phrase may have been chosen for availability rather than for its precise connotation.",
    });
  }

  factors.push({
    id: "personality",
    tag: "Personality or relationship history",
    kind: "individual",
    note: "Individual habits — how brief someone usually is, how much they disclose, how the two of you have spoken before — often explain more than any group-level pattern.",
  });

  if (input.desiredOutcome === "avoid-conflict" || input.desiredOutcome === "preserve-relationship") {
    factors.push({
      id: "avoidance",
      tag: "Conflict avoidance",
      kind: "individual",
      note: "One or both of you may be steering away from an uncomfortable topic, which can make the exchange feel unfinished.",
    });
  }

  return factors;
}

/* -------------------------------------------------------- interpretations */

function buildInterpretations(input: SituationInput): Interpretation[] {
  const clueBase: string[] = [];
  if (input.exactWords) clueBase.push(`The wording you recorded: “${input.exactWords.trim()}”`);
  if (input.toneAndBodyLanguage) clueBase.push(`Tone or body language you noticed: ${input.toneAndBodyLanguage.trim()}`);
  if (input.beforeAfter) clueBase.push(`What happened around it: ${input.beforeAfter.trim()}`);
  if (input.relationship) clueBase.push(`Relationship: ${RELATIONSHIP_LABEL[input.relationship]}`);
  if (input.socialContext) clueBase.push(`Where it happened: ${input.socialContext.trim()}`);
  const clues = clueBase.length ? clueBase : ["Only your own account of the exchange is available."];

  const hasPower = input.relationship ? POWER_GAP.has(input.relationship) : false;

  const list: Interpretation[] = [
    {
      id: "reassurance",
      title: "Reassurance rather than information",
      mightHaveMeant:
        "One possible interpretation is that the other person wanted to lower your worry, without intending to confirm or deny anything specific.",
      whyPlausible:
        "Soft, general wording is often used when someone wants to be kind but does not want to commit to a detail. This reading fits the exchange without requiring any hidden negative meaning.",
      clues,
      plausibility: "more-plausible",
    },
    {
      id: "constraint",
      title: "A constraint on what they could say",
      mightHaveMeant:
        "They may have been unable to share more at that moment because of a rule, a pending decision, or information they did not yet have.",
      whyPlausible: hasPower
        ? "In this kind of relationship, one side often controls timing and disclosure. A vague answer can be a policy answer rather than a personal one."
        : "People frequently answer vaguely when a decision is not final, when they are speaking for someone else, or when the setting is not private.",
      clues,
      plausibility: hasPower ? "more-plausible" : "possible",
    },
    {
      id: "closing",
      title: "A polite way of closing the conversation",
      mightHaveMeant:
        "The phrasing may have been a signal that the topic was finished for now — because of time, setting, or discomfort — rather than a judgement about you.",
      whyPlausible:
        "Short, warm closings are a common way to end a topic without refusing outright. This may be influenced by norms around not saying 'no' directly, or simply by a busy moment.",
      clues,
      plausibility: "possible",
    },
    {
      id: "literal",
      title: "A straightforwardly literal answer",
      mightHaveMeant:
        "They may have meant exactly what they said, with no additional layer of implication at all.",
      whyPlausible:
        "It is easy to over-read an ambiguous line. If this person is usually brief or literal with everyone, the simplest reading may be the accurate one.",
      clues,
      plausibility: "possible",
    },
    {
      id: "mismatch",
      title: "A mismatch in expected explicitness",
      mightHaveMeant:
        "They may have believed they had answered clearly, while you were expecting a more explicit statement.",
      whyPlausible:
        "In some pairings, one person treats implication as sufficient and the other treats it as evasive. Neither is doing anything wrong; the expectations simply differ.",
      clues,
      plausibility: "requires-more-context",
    },
  ];

  const rotation = hash(input.situation) % 2;
  if (rotation === 0) return list;
  const order = [0, 2, 1, 4, 3];
  return order.map((i) => list[i]!);
}

/* ------------------------------------------------------------- strategies */

function buildStrategy(input: SituationInput): Strategy {
  const hasPower = input.relationship ? POWER_GAP.has(input.relationship) : false;

  switch (input.desiredOutcome) {
    case "express-disagreement":
      return {
        name: hasPower ? "Shared-goal framing" : "Neutral clarification, then position",
        why: hasPower
          ? "Because there is likely a difference in authority here, leading with a shared goal ('we both want this to go well') tends to keep the disagreement workable, and keeps the focus on the issue rather than on the relationship."
          : "Checking what they meant before stating your view avoids arguing against something they never said, and makes your disagreement land as considered rather than reactive.",
        cautions: hasPower
          ? "If speaking up could affect your grade, job or standing, it is reasonable to raise it in writing, later, or with someone who can support you. Nothing here obliges you to confront anyone."
          : undefined,
      };
    case "avoid-conflict":
    case "preserve-relationship":
      return {
        name: "Active listening and perspective-taking",
        why: "Your stated goal is to keep the relationship steady. Reflecting back what you heard, and asking whether you understood it correctly, usually lowers the temperature and gives the other person an easy route to say more.",
      };
    case "apologise":
      return {
        name: "Relationship-building",
        why: "A short, specific acknowledgement of the effect — without over-explaining your intent — tends to repair more than a long justification does.",
      };
    case "solve-problem":
      return {
        name: "Cooperation",
        why: "You need a practical result, so framing the next message around the concrete step you both need makes it easy for the other person to help without revisiting the misunderstanding.",
      };
    case "ask-clarification":
      return {
        name: "Neutral clarification",
        why: "A single, non-accusatory question is the cheapest way to replace guesswork with information, and it gives the other person room to answer without losing face.",
      };
    default:
      return {
        name: "Neutral clarification",
        why: "There is not enough information to determine the speaker's intention with certainty, so the most useful next move is a question that tests the interpretations rather than a response that assumes one of them.",
        cautions: hasPower
          ? "Given the likely difference in authority, keep the question short and low-stakes; you are asking for a small confirmation, not an explanation."
          : undefined,
      };
  }
}

/* -------------------------------------------------------------- responses */

function buildResponses(input: SituationInput): ResponseOption[] {
  const lang = input.responseLanguage?.trim();
  const langNote = lang && !/^english$/i.test(lang) ? ` (draft in English — you asked for ${lang}; adapt the register when you translate)` : "";

  return [
    {
      id: "gentle",
      style: "gentle",
      label: "Gentle and relationship-preserving",
      wording: `Thank you, that's reassuring. If it's alright, I'd like to make sure I understood you correctly — were you saying things are on track, even if the details can't be shared yet?${langNote}`,
      toneVariants: {
        warmer: "Thank you, that really is reassuring — I appreciate you saying it. If it's alright, could I just check that I understood you correctly?",
        "more-formal":
          "Thank you for the reassurance. I would like to confirm that I have understood you correctly: were you indicating that matters are on track, even if the details cannot yet be shared?",
        "more-concise": "Thank you — just to check I understood: things are on track, even if details can't be shared yet?",
        "more-direct": "Thanks. Can I check what you meant — that things are on track, or that you can't discuss it yet?",
        "more-deferential":
          "Thank you very much, and sorry to ask again. Would it be alright if I checked that I understood you correctly?",
      },
      likelyEffect:
        "Signals goodwill first, so the other person is unlikely to feel challenged and can add information easily if they have any.",
      tradeOff: "May be soft enough that they simply repeat the reassurance, leaving you with the same uncertainty.",
    },
    {
      id: "direct",
      style: "direct",
      label: "Clear and direct",
      wording: `Thanks for saying that. To be honest I'm still unsure how to read it — did you mean that there's nothing to be concerned about, or that this isn't something you can discuss right now?${langNote}`,
      toneVariants: {
        warmer: "Thanks for saying that — I do appreciate it. I'm still a little unsure how to read it: nothing to be concerned about, or not something you can discuss yet?",
        "more-formal":
          "Thank you. I am still uncertain how to interpret your reply: did you mean that there is no cause for concern, or that this cannot be discussed at present?",
        "more-concise": "Thanks — did you mean there's nothing to worry about, or that you can't discuss it yet?",
        "more-direct": "Did you mean there's nothing to worry about, or that you can't tell me yet?",
        "more-deferential":
          "Thank you, and apologies for pressing. Might I ask whether you meant there is no cause for concern, or that it cannot be discussed yet?",
      },
      likelyEffect: "Most likely to produce a usable answer quickly, because it names the two readings explicitly.",
      tradeOff:
        "If the other person is constrained or values indirectness, naming both readings may feel like pressure and could prompt a shorter reply.",
    },
    {
      id: "balanced",
      style: "balanced",
      label: "Balanced",
      wording: `Thank you — I took that as a good sign. I don't want to read too much into it, so I wanted to check: is there anything I should be doing differently in the meantime?${langNote}`,
      toneVariants: {
        warmer: "Thank you — I took that as a good sign, and I appreciate it. I don't want to read too much into it, so: anything I should be doing differently meanwhile?",
        "more-formal":
          "Thank you. I understood that as a positive indication. So as not to over-interpret it, may I ask whether there is anything I should be doing differently in the meantime?",
        "more-concise": "Thank you. Is there anything I should be doing differently in the meantime?",
        "more-direct": "Thanks. Should I be doing anything differently in the meantime?",
        "more-deferential":
          "Thank you very much. I hope it is alright to ask — is there anything you would advise me to do differently in the meantime?",
      },
      likelyEffect:
        "Moves the exchange from interpretation to action, which usually gets a substantive answer without asking anyone to reveal what they cannot.",
      tradeOff: "Does not directly resolve what the original phrase meant; you may learn what to do without learning what they meant.",
    },
  ];
}

/* --------------------------------------------------------------- assembly */

export function runMockAnalysis(input: SituationInput): Analysis {
  const observed: string[] = ["The words that were actually said or written, as you recall them."];
  if (input.exactWords) observed.push(`Exact wording you noted: “${input.exactWords.trim()}”`);
  if (input.toneAndBodyLanguage) observed.push(`Tone or body language you noticed: ${input.toneAndBodyLanguage.trim()}`);
  if (input.beforeAfter) observed.push(`What happened immediately before or after: ${input.beforeAfter.trim()}`);
  observed.push("The setting, timing and channel of the exchange.");

  const inferred: string[] = [
    "That the phrasing was chosen deliberately, rather than said in passing.",
    "That a short or vague answer signals something about how the other person sees you.",
    "That their internal state (comfort, approval, irritation) can be read from the surface wording.",
  ];
  if (input.theirBackground)
    inferred.push(
      "That their background explains the choice of words. Background can shape expectations, but it does not determine what one individual meant on one occasion.",
    );

  const factors = buildFactors(input);

  return {
    id: `${Date.now().toString(36)}-${(hash(input.situation) % 9999).toString(36)}`,
    createdAt: new Date().toISOString(),
    title: titleFrom(input),
    input,
    safetyNotice: SAFETY_PATTERNS.test(input.situation) ? SAFETY_NOTICE : undefined,
    literalMeaning:
      "Taken at face value, the words describe a state of affairs and nothing more: they state that a particular concern is not necessary right now. Literally, they neither confirm nor deny any specific outcome, and they do not contain an evaluation of you. Everything beyond that is implication rather than statement.",
    interpretations: buildInterpretations(input),
    gapFactors: factors,
    observed,
    inferred,
    uncertainties: [
      "Whether the other person was free to say more than they did.",
      "Whether the wording was considered or automatic.",
      "How this person usually speaks in this kind of exchange, and whether anything about it was unusual.",
      "There is not enough information to determine the speaker's intention with certainty.",
    ],
    wouldHelp: [
      input.exactWords
        ? "How the same person has answered similar questions with you before."
        : "The exact words used, as closely as you can recall them.",
      input.toneAndBodyLanguage
        ? "Any rule or policy that applies to what they are allowed to share."
        : "Their tone, pace, and expression at the moment they said it.",
    ],
    strategy: buildStrategy(input),
    responses: buildResponses(input),
    clarificationQuestion:
      "“Thank you — just so I understand you correctly, did you mean that things are fine as they stand, or that this isn't something that can be discussed yet?”",
  };
}
