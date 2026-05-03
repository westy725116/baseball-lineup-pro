// Lineup Pro brand logo. Source file lives in /public/.
// Pass `height` to scale (width auto-adjusts to preserve aspect ratio).
export default function Logo({
  height = 40,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/lineup-pro-logo-original.png"
      alt="Lineup Pro"
      style={{ height: `${height}px`, width: "auto" }}
      className={className}
    />
  );
}
