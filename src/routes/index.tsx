import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CulturePicker } from "@/components/culture/culture-picker";
import { CultureTracks } from "@/components/graphics/culture-tracks";

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
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
      {/* Poster headline — typography does the work, wrapping is deliberate. */}
      <section className="animate-rise">
        <p className="eyebrow text-foreground/60">An AI cultural translator</p>
        <h1 className="display-xl mt-4 text-[clamp(3rem,15vw,8.5rem)]">
          Understand
          <br />
          <span className="bg-foreground px-2 text-background">What They</span>
          <br />
          Mean
        </h1>
        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
            Several readings of the same moment. No verdicts — you decide which one fits, and how to reply.
          </p>
          <Link
            to="/analyse"
            search={{}}
            className="group inline-flex items-center justify-between gap-6 border-2 border-foreground bg-coral px-6 py-5 font-display text-lg font-extrabold tracking-tight transition-transform duration-200 hover:-translate-y-1 sm:text-xl"
          >
            Analyse a situation
            <ArrowRight className="h-7 w-7 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <hr className="rule-thick mt-10" />
      <CultureTracks mode="diverge" count={4} className="h-14" markers />

      <section className="mt-8">
        <CulturePicker />
      </section>

      {/* Secondary routes as flat colour blocks rather than SaaS cards. */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Tile to="/compose" color="bg-green" label="Organise language" number="02" />
        <Tile to="/saved" color="bg-pink" label="Saved scenarios" number="03" />
        <Tile to="/review" color="bg-lime" label="Review &amp; practise" number="04" />
      </section>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 border-2 border-foreground px-5 py-5">
        <p className="max-w-sm text-sm leading-relaxed">
          Not sure where to start? Walk through a worked example first.
        </p>
        <Link
          to="/analyse"
          search={{ example: true }}
          className="group inline-flex items-center gap-2 font-display text-base font-extrabold tracking-tight underline underline-offset-4"
        >
          Try an example
          <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </section>
    </div>
  );
}

function Tile({ to, color, label, number }: { to: string; color: string; label: string; number: string }) {
  return (
    <Link
      to={to}
      className={`group flex min-h-36 flex-col justify-between border-2 border-foreground ${color} p-5 transition-transform duration-200 hover:-translate-y-1`}
    >
      <span className="numeral text-3xl opacity-40">{number}</span>
      <span className="flex items-end justify-between gap-2">
        <span className="font-display text-xl font-extrabold leading-none tracking-tight">{label}</span>
        <ArrowRight className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
