import { RANK_LABEL, type HandRank } from "../engine/evaluate";
import { PAYTABLE } from "../engine/paytable";

/**
 * The Paytable panel: the nine paying Ranks in table order, label left and
 * payout right in monospace tabular numbers. The row matching the current
 * Rank turns gold — but only when it actually pays: a losing High Card
 * highlights nothing. Static config, so a reload never changes it.
 */

interface PaytableProps {
  /** Rank of the Hand on the felt, or null while idle. */
  rank: HandRank | null;
}

export default function Paytable({ rank }: PaytableProps) {
  const payingRanks = [...PAYTABLE].filter(([, payout]) => payout > 0);

  return (
    <aside className="w-full max-w-sm rounded-lg bg-rail/70 p-3 ring-1 ring-gold/20 lg:w-60 lg:shrink-0">
      <h2 className="mb-2 text-center font-serif text-[0.7rem] font-bold tracking-[0.35em] text-gold uppercase">
        Paytable
      </h2>
      <ul className="grid grid-cols-3 gap-x-4 gap-y-1 lg:flex lg:flex-col lg:gap-0">
        {payingRanks.map(([entry, payout]) => {
          const hot = entry === rank;
          return (
            <li
              key={entry}
              className={`flex flex-col rounded px-2 py-0.5 lg:flex-row lg:items-baseline lg:justify-between ${
                hot ? "bg-gold font-bold text-rail" : "text-cream/85"
              }`}
            >
              <span className="text-[0.65rem] leading-tight lg:text-xs">
                {RANK_LABEL[entry]}
              </span>
              <span className="self-end font-mono text-[0.65rem] tabular-nums lg:self-auto lg:text-xs">
                {payout}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
