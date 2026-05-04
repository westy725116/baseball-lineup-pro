// Lineup Pro brand logo. Source files live in /public/.
// Default = horizontal lockup (icon + wordmark side-by-side) for nav headers.
// Use <FullLogo /> for the stacked / square version (icon over wordmark).
export default function Logo({
  height = 64,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/lineup-pro-horizontal-1920x1080.png"
      alt="Lineup Pro"
      style={{ height: `${height}px`, width: "auto" }}
      className={className}
    />
  );
}

// Full stacked logo (icon over wordmark) — use for hero / brand moments.
export function FullLogo({
  height = 200,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/lineup-pro-ful-1920x1080.png"
      alt="Lineup Pro"
      style={{ height: `${height}px`, width: "auto" }}
      className={className}
    />
  );
}
