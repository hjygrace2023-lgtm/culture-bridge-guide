import type { ReactNode } from "react";
import { CultureTracks, type TrackMode } from "@/components/graphics/culture-tracks";
import { cn } from "@/lib/utils";

/**
 * Shared editorial page opener: small caps eyebrow, oversized display heading,
 * a thick rule and the culture-track motif. Every page inherits the same rhythm.
 */
export function PageHeading({
  eyebrow,
  title,
  lede,
  aside,
  tracks = "parallel",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  tracks?: TrackMode | "none";
  className?: string;
}) {
  return (
    <header className={cn("animate-rise", className)}>
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow text-foreground/60">{eyebrow}</p>
        {aside}
      </div>
      <h1 className="display-xl mt-3 text-[clamp(2.4rem,9vw,4.5rem)]">{title}</h1>
      {lede && <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{lede}</p>}
      <hr className="rule-thick mt-6" />
      {tracks !== "none" && <CultureTracks mode={tracks} count={3} className="mt-0 h-8" markers />}
    </header>
  );
}
