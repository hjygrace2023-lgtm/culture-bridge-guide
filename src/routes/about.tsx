import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Methodology — CultureLens" },
      {
        name: "description",
        content:
          "How CultureLens reasons: intercultural conflict-resolution principles, and why it offers possibilities rather than verdicts.",
      },
      { property: "og:title", content: "Methodology — CultureLens" },
      { property: "og:description", content: "Principles, limits, and responsible-use commitments." },
    ],
  }),
  component: AboutPage,
});

const PRINCIPLES = [
  ["Active listening", "Reflecting back what was said before responding to what you assume was meant."],
  ["Perspective-taking", "Considering constraints and goals the other person may be working with."],
  ["Cooperation", "Treating the exchange as a shared problem rather than a contest."],
  ["Shared-goal framing", "Naming an outcome you both want before naming the disagreement."],
  ["Compromise", "Trading on what matters less to you and more to them, where that is fair."],
  ["Educational explanation", "Making your own expectations explicit rather than expecting them to be inferred."],
  ["Scenario-based practice", "Rehearsing on saved situations so the reasoning becomes familiar."],
  ["Emotional and cultural self-awareness", "Noticing your own reaction before deciding what it means."],
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-5 pb-8 pt-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-semibold">Methodology</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          CultureLens is built on intercultural conflict-resolution principles. It treats culture as one influence
          among several — alongside institutional rules, power, age, personality, history and the situation itself —
          and never as a rulebook that decides what a person meant.
        </p>
      </header>

      <section className="animate-rise card-surface p-5">
        <h2 className="text-base font-semibold">Principles it draws on</h2>
        <dl className="mt-3 space-y-3">
          {PRINCIPLES.map(([name, body]) => (
            <div key={name}>
              <dt className="text-sm font-semibold">{name}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          These strategies do not work identically in every situation. What repairs one relationship can strain
          another, and the same phrasing can land differently depending on setting, timing and history. CultureLens
          offers possibilities, not definitive judgments.
        </p>
      </section>

      <section className="animate-rise card-surface p-5">
        <h2 className="text-base font-semibold">What it will not do</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
          <li>· Make absolute claims about a nationality, ethnicity, gender, religion or social group.</li>
          <li>· Rank cultures as better or worse.</li>
          <li>· Diagnose someone's personality or state their intention as fact.</li>
          <li>· Attach numerical probabilities where there is no evidence for them.</li>
          <li>
            · Encourage confrontation where you may face a significant power imbalance; where safety, harassment,
            discrimination or violence may be involved, it points towards a trusted person or professional support
            instead.
          </li>
          <li>· Invent academic sources or claim it has scientifically determined anyone's intention.</li>
        </ul>
      </section>

      <section className="animate-rise card-surface p-5">
        <h2 className="text-base font-semibold">Reference</h2>
        <a
          href="https://www.nature.com/articles/s41599-025-04391-0"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Humanities and Social Sciences Communications, article s41599-025-04391-0
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This is the only source cited. CultureLens does not claim endorsement by it.
        </p>
      </section>

      <section className="animate-rise card-surface p-5">
        <h2 className="text-base font-semibold">About this version</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This MVP generates its analyses locally from a structured template so the whole flow can be used without an
          API key. The output is shaped exactly like a future model response, so connecting a secure server-side AI
          call changes one module and nothing you see here. No API key is ever placed in the browser.
        </p>
      </section>
    </div>
  );
}
