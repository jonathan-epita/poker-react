/**
 * The Badge: a gold-bordered pill naming the current Hand. Informational only
 * — payout comes from the post-Draw hand (phase 05) — so the caption under it
 * says what to do with it. Rendered only while a Hand is on the felt.
 */

interface ResultBadgeProps {
  /** The hand name, straight from `evaluate` — never a literal at the call site. */
  label: string;
}

export default function ResultBadge({ label }: ResultBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        data-testid="result-badge"
        className="rounded-full bg-gold/10 px-6 py-1.5 font-serif text-lg font-bold tracking-[0.2em] text-gold uppercase shadow-[0_4px_16px_-6px_rgb(217_164_65/0.5)] ring-1 ring-gold/70"
      >
        {label}
      </span>
      <span className="text-[0.65rem] tracking-[0.2em] text-cream/50 uppercase">
        Draw to try for a payout
      </span>
    </div>
  );
}
