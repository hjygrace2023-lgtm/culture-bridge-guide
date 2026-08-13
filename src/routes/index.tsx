import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareQuote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CulturePicker } from "@/components/culture/culture-picker";

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

function Home() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-10 pt-12 sm:pt-20">
      <section className="animate-rise text-center">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Culture<span className="text-primary">Lens</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
          Good to see you — let's look at what was meant, together.
        </p>
      </section>

      <section className="animate-rise mt-10" style={{ animationDelay: "80ms" }}>
        <CulturePicker />
      </section>

      <section className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" style={{ animationDelay: "140ms" }}>
        <Button asChild size="lg" className="h-12 rounded-full px-6 text-sm shadow-card transition-transform hover:-translate-y-0.5">
          <Link to="/analyse" search={{}}>
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
            <MessageSquareQuote className="mr-1 h-4 w-4" /> Organise language
          </Link>
        </Button>
      </section>

      <div className="animate-rise mt-3 text-center" style={{ animationDelay: "180ms" }}>
        <Button asChild variant="ghost" className="rounded-full text-sm text-muted-foreground hover:text-foreground">
          <Link to="/analyse" search={{ example: true }}>
            <Sparkles className="mr-1 h-4 w-4" /> Try an example
          </Link>
        </Button>
      </div>
    </div>
  );
}
