/**
 * The Paytable: the ONLY place payout values live (9/6 Jacks-or-Better, per
 * the MASTER PLAN). The panel renders from this map; nothing else hard-codes
 * a payout.
 */

import { HandRank } from "./evaluate";

/** Credits per credit bet, insertion-ordered best-first to match the Ranks. */
export const PAYTABLE: ReadonlyMap<HandRank, number> = new Map([
  [HandRank.ROYAL_FLUSH, 250],
  [HandRank.STRAIGHT_FLUSH, 50],
  [HandRank.FOUR_OF_A_KIND, 25],
  [HandRank.FULL_HOUSE, 9],
  [HandRank.FLUSH, 6],
  [HandRank.STRAIGHT, 4],
  [HandRank.THREE_OF_A_KIND, 3],
  [HandRank.TWO_PAIR, 2],
  [HandRank.JACKS_OR_BETTER, 1],
  [HandRank.HIGH_CARD, 0],
]);

/**
 * Payout for a settled Hand: table value × bet. The `bet` factor arrives with
 * the betting controls of phase 06 — the parameter is part of the contract.
 */
export function payoutFor(rank: HandRank, bet: number): number {
  return (PAYTABLE.get(rank) ?? 0) * bet;
}
