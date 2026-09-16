import { cn } from "@/lib/utils";

/**
 * CultureLens signature motif.
 *
 * Coloured tracks stand for different cultural readings of the same moment:
 * they run parallel when interpretations agree, diverge when they differ and
 * converge where meanings overlap. Flat, geometric, never literal.
 */
export type TrackMode = "parallel" | "diverge" | "converge";

const COLORS = ["var(--coral)", "var(--green)", "var(--yellow)", "var(--pink)"];

function path(mode: TrackMode, index: number, total: number) {
  const spread = 14;
  const base = 30 + (index - (total - 1) / 2) * spread;
  if (mode === "parallel") return `M0 ${base} L200 ${base}`;
  if (mode === "diverge") {
    const end = 30 + (index - (total - 1) / 2) * spread * 2.4;
    return `M0 30 C70 30, 110 ${end}, 200 ${end}`;
  }
  return `M0 ${base + (index - (total - 1) / 2) * spread} C80 ${base}, 130 30, 200 30`;
}

export function CultureTracks({
  mode = "parallel",
  count = 3,
  className,
  markers = false,
}: {
  mode?: TrackMode;
  count?: number;
  className?: string;
  markers?: boolean;
}) {
  const tracks = Array.from({ length: count }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-12 w-full", className)}
    >
      {tracks.map((i) => (
        <path
          key={i}
          d={path(mode, i, count)}
          fill="none"
          stroke={COLORS[i % COLORS.length]}
          strokeWidth={5}
          strokeLinecap="round"
          className="animate-track"
          style={{ ["--track-length" as string]: 260, animationDelay: `${i * 70}ms` }}
        />
      ))}
      {markers &&
        tracks.map((i) => (
          <circle
            key={`m-${i}`}
            cx={6}
            cy={mode === "diverge" ? 30 : 30 + (i - (count - 1) / 2) * 14}
            r={5}
            fill="var(--background)"
            stroke="var(--foreground)"
            strokeWidth={2}
          />
        ))}
    </svg>
  );
}
