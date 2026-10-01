/**
 * The History rail: one line of the Session ledger, right of CREDITS —
 * hands played, best settled Rank, net credits. A readout, not a feature:
 * every number arrives from `sessionStats`, and the ledger itself lives
 * only in reducer memory (reload wipes it, the one-shot promise holds).
 * Hidden entirely while History is empty — an idle machine shows no zeros.
 * `whitespace-nowrap` keeps it a single line at any phone width; the header
 * flow may drop it under CREDITS, never let it wrap or push the BET pills.
 */

import { RANK_LABEL } from "../engine/evaluate";
import type { SessionStats } from "../game/reducer";

/** Signed NET, ledger-style: U+2212 for a loss, "+" for a gain, plain 0. */
function netText(net: number): string {
  if (net > 0) return `+${net}`;
  if (net < 0) return `−${-net}`;
  return "0";
}

/** Gold tracked labels, same family as the CREDITS readout. */
const LABEL =
  "font-serif text-[0.7rem] font-bold tracking-[0.35em] text-gold uppercase";

/** Mono digits for the counters, like the credits themselves. */
const DIGIT = "font-mono text-sm font-bold text-gold tabular-nums sm:text-base";

/** The Rank is a word, so it keeps its natural casing and softer tracking. */
const VALUE = "font-serif text-sm font-bold text-gold sm:text-base";

const DOT = "text-gold/50";

export default function HistoryRail({ hands, best, net }: SessionStats) {
  if (hands === 0) return null;
  return (
    <p
      data-testid="history-rail"
      className="flex items-baseline gap-2 whitespace-nowrap"
    >
      <span className={LABEL}>Hands</span>
      <span className={DIGIT}>{hands}</span>
      <span aria-hidden="true" className={DOT}>
        ·
      </span>
      <span className={LABEL}>Best</span>
      <span className={VALUE}>{best === null ? "—" : RANK_LABEL[best]}</span>
      <span aria-hidden="true" className={DOT}>
        ·
      </span>
      <span className={LABEL}>Net</span>
      <span className={DIGIT}>{netText(net)}</span>
    </p>
  );
}
