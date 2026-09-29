/**
 * The torn top edge of a paper band. Place it at the top of a coloured section;
 * it draws upward in the section's colour so the band looks torn from a sheet.
 */
export function TornEdge({ color, seed = 3, className = "" }: { color: string; seed?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 28"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 bottom-full block h-5 w-full sm:h-7 ${className}`}
    >
      <path d={tornPath(seed)} fill={color} />
    </svg>
  );
}

// Deterministic jagged line so the edge is the same on the server and in the browser.
function tornPath(seed: number) {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let d = "M0 28 L0 18";
  for (let x = 0; x <= 1440; x += 18 + rand() * 34) {
    // Mostly small tears, with an occasional taller peak.
    const peak = rand() < 0.08 ? 2 + rand() * 6 : 12 + rand() * 12;
    d += ` L${x.toFixed(0)} ${peak.toFixed(1)}`;
  }
  return `${d} L1440 16 L1440 28 Z`;
}
