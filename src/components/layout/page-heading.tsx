import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared page opener: small caps eyebrow, large display heading and a single
 * thick rule. Deliberately quiet — no decorative colour stripes.
 */
export function PageHeading({
  eyebrow,
  title,
  lede,
  aside,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("animate-rise", className)}>
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow text-foreground/60">{eyebrow}</p>
        {aside}
      </div>
      <h1 className="display-xl mt-3 text-[clamp(2.2rem,7.5vw,3.6rem)]">{title}</h1>
      {lede && <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{lede}</p>}
      <hr className="rule-thick mt-5" />
    </header>
  );
}
