import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareQuote } from "lucide-react";
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

function Home() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-10 sm:px-5 sm:pt-16">
      <section className="animate-rise text-center">
        <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
          Culture<span className="text-primary">Lens</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Something said that you're still turning over? Describe it, and we'll look at what it might have meant.
        </p>

        <div className="mt-7 space-y-2.5">
          <Button asChild size="lg" className="h-12 w-full rounded-full text-sm shadow-card">
            <Link to="/analyse">
              Analyse a situation <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="h-12 w-full rounded-full text-sm">
            <Link to="/compose">
              <MessageSquareQuote className="mr-1.5 h-4 w-4" /> Help me word something
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-full text-sm text-muted-foreground">
            <Link to="/analyse" search={{ example: true }}>
              Try an example
            </Link>
          </Button>
        </div>
      </section>

      <p className="animate-rise mt-10 text-center text-[11px] leading-relaxed text-muted-foreground">
        CultureLens identifies possibilities, not people's definite intentions.
      </p>
    </div>
  );
}
