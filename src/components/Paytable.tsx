import { RANK_LABEL, type HandRank } from "../engine/evaluate";
import { PAYTABLE } from "../engine/paytable";

/**
 * The Paytable panel: the nine paying Ranks in table order, label left and
 * payout right in monospace tabular numbers. Values are credits-per-credit-bet
 * × the current Bet, so the rows tick with the selector. The row matching the
 * current Rank turns gold — but only when it actually pays: a losing High
 * Card highlights nothing. When a paying Settle lands, that row glows gold
 * twice and rests. Static config, so a reload never changes it.
 */

interface PaytableProps {
  /** Rank of the Hand on the felt, or null while idle. */
  rank: HandRank | null;
  /** The current Bet — every displayed payout scales with it. */
  bet: number;
  /** True when the settled Hand paid: the highlighted row glows. */
  won?: boolean;
}

export default function Paytable({ rank, bet, won = false }: PaytableProps) {
  const payingRanks = [...PAYTABLE].filter(([, payout]) => payout > 0);

  return (
    <aside className="w-full max-w-sm rounded-lg bg-rail/70 p-2 ring-1 ring-gold/20 md:w-56 md:shrink-0 md:p-3 lg:w-60">
      <h2 className="mb-1 text-center font-serif text-[0.7rem] font-bold tracking-[0.35em] text-gold uppercase md:mb-2">
        Paytable · Bet {bet}
      </h2>
      <ul className="grid grid-cols-3 gap-x-3 gap-y-0.5 md:flex md:flex-col md:gap-0">
        {payingRanks.map(([entry, payout]) => {
          const hot = entry === rank;
          return (
            <li
              key={entry}
              className={`flex flex-col rounded px-2 py-0.5 leading-tight md:flex-row md:items-baseline md:justify-between ${
                hot ? "bg-gold font-bold text-rail" : "text-cream/85"
              } ${hot && won ? "animate-glow" : ""}`}
            >
              <span className="text-[0.6rem] leading-tight md:text-xs">
                {RANK_LABEL[entry]}
              </span>
              <span className="self-end font-mono text-[0.6rem] leading-tight tabular-nums md:self-auto md:text-xs">
                {payout * bet}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
