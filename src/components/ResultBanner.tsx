/**
 * The settled ResultBanner: replaces the informational Badge once the Hand
 * settles. A paying Hand reads `RESULT — {label} · +{payout}` and glows gold;
 * a silent one reads `{label} · no payout` and stays dim. The caption keeps
 * the banked rule visible: only the final Hand pays.
 */

interface ResultBannerProps {
  /** The final Hand's name, straight from `evaluate`. */
  label: string;
  /** Credits the Settle added — 0 for a Hand that did not pay. */
  payout: number;
}

export default function ResultBanner({ label, payout }: ResultBannerProps) {
  const won = payout > 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        data-testid="result-banner"
        className={`rounded-full px-6 py-1.5 font-serif text-lg font-bold tracking-[0.2em] uppercase ${
          won
            ? "bg-gold/15 text-gold shadow-[0_0_22px_-2px_rgb(217_164_65/0.8)] ring-1 ring-gold"
            : "text-cream/50 ring-1 ring-cream/15"
        }`}
      >
        {won ? `Result — ${label} · +${payout}` : `${label} · no payout`}
      </span>
      <span className="text-[0.65rem] tracking-[0.2em] text-cream/50 uppercase">
        Only the final hand pays
      </span>
    </div>
  );
}
