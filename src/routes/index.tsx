import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareQuote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CultureLens — Understand what was meant, not just what was said" },
      {
        name: "description",
        content:
          "CultureLens helps you explore several plausible readings of an intercultural exchange and choose a response that fits your goal.",
      },
      { property: "og:title", content: "CultureLens — an AI cultural translator" },
      {
        property: "og:description",
        content: "Separate literal meaning from implied meaning, then decide how you want to respond.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  { n: "1", title: "Describe what happened", body: "In your own words. Context is optional, never required." },
  { n: "2", title: "Explore possible meanings", body: "Several plausible readings, with the reasoning behind each." },
  { n: "3", title: "Choose how to respond", body: "Draft replies and a clarification question, with trade-offs." },
];

function Home() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-6 pt-10 sm:pt-16">
      <section className="animate-rise text-center">
        <p className="text-sm font-medium tracking-wide text-primary">An AI cultural translator</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Culture<span className="text-primary">Lens</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Hello — good to see you. Something said that you're still turning over? Let's look at what it might have
          meant, together and without jumping to conclusions.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-12 rounded-full px-6 text-sm shadow-card transition-transform hover:-translate-y-0.5">
            <Link to="/analyse">
              Analyse a situation <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="h-12 rounded-full px-6 text-sm transition-transform hover:-translate-y-0.5"
          >
            <Link to="/compose">
              <MessageSquareQuote className="mr-1 h-4 w-4" /> Organise language for an output
            </Link>
          </Button>
        </div>

        <div className="mt-3">
          <Button asChild variant="ghost" className="rounded-full text-sm text-muted-foreground hover:text-foreground">
            <Link to="/analyse" search={{ example: true }}>
              <Sparkles className="mr-1 h-4 w-4" /> Try an example
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className="animate-rise card-surface p-5"
            style={{ animationDelay: `${100 + i * 80}ms` }}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {step.n}
            </span>
            <h2 className="mt-3 text-sm font-semibold">{step.title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <p className="mt-10 rounded-2xl bg-muted/70 px-5 py-4 text-center text-xs leading-relaxed text-muted-foreground">
        CultureLens identifies possibilities, not people's definite intentions.
      </p>
    </div>
  );
}
