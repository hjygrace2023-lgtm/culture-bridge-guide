/**
 * App-wide tiled background texture.
 *
 * Original abstract motifs (open arcs, dots, short strokes — suggesting
 * overlapping conversation lines) drawn as an inline SVG data URI so it tiles
 * seamlessly with no network request. Kept at very low opacity so text
 * contrast is unaffected. Mounted once, globally, in __root.
 */
export function CultureBackground() {
  return <div aria-hidden className="culture-bg" />;
}
