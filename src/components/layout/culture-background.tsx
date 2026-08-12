import { backgroundImageFor, useCultureTheme } from "@/lib/theme/culture-theme";

/** Fixed, low-contrast tiled backdrop behind all content (WhatsApp-style). */
export function CultureBackground() {
  const { id, theme } = useCultureTheme();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background">
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: backgroundImageFor(id),
          backgroundSize: `${theme.size}px auto`,
        }}
      />
    </div>
  );
}
