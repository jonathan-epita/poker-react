/**
 * Hand evaluation: the ONE place five cards become a Rank. Total by
 * construction — a Hand always evaluates, worst case to HIGH_CARD.
 */

import { type Card, type Rank } from "./cards";

/** The ten possible Ranks, ordered best first — the Paytable follows this order. */
export enum HandRank {
  ROYAL_FLUSH,
  STRAIGHT_FLUSH,
  FOUR_OF_A_KIND,
  FULL_HOUSE,
  FLUSH,
  STRAIGHT,
  THREE_OF_A_KIND,
  TWO_PAIR,
  JACKS_OR_BETTER,
  HIGH_CARD,
}

/** Human-readable Rank names — the Badge and Paytable render from this, never literals. */
export const RANK_LABEL: Record<HandRank, string> = {
  [HandRank.ROYAL_FLUSH]: "Royal Flush",
  [HandRank.STRAIGHT_FLUSH]: "Straight Flush",
  [HandRank.FOUR_OF_A_KIND]: "Four of a Kind",
  [HandRank.FULL_HOUSE]: "Full House",
  [HandRank.FLUSH]: "Flush",
  [HandRank.STRAIGHT]: "Straight",
  [HandRank.THREE_OF_A_KIND]: "Three of a Kind",
  [HandRank.TWO_PAIR]: "Two Pair",
  [HandRank.JACKS_OR_BETTER]: "Jacks or Better",
  [HandRank.HIGH_CARD]: "High Card",
};

interface HandResult {
  rank: HandRank;
  label: string;
}

/** A pair of this Rank or higher qualifies for JACKS_OR_BETTER (J = 11). */
const PAIR_QUALIFIER: Rank = 11;

/** The top card of a straight, or 0 when the Hand is not one. */
function straightTop(hand: readonly Card[]): number {
  const ranks = [...new Set(hand.map((card) => card.rank))].sort(
    (a, b) => b - a,
  );
  if (ranks.length !== 5) return 0;
  if (ranks[0] - ranks[4] === 4) return ranks[0];
  // The wheel: A-2-3-4-5, ace playing low with 5 as the top card. No wraparound.
  if (ranks[0] === 14 && ranks[1] === 5) return 5;
  return 0;
}

interface RankGroup {
  rank: Rank;
  count: number;
}

/** Cards grouped by Rank, ordered by count desc then rank desc. */
function rankGroups(hand: readonly Card[]): RankGroup[] {
  const counts = new Map<Rank, number>();
  for (const card of hand) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return [...counts]
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
}

function rankOf(hand: readonly Card[]): HandRank {
  const flush = hand.every((card) => card.suit === hand[0].suit);
  const top = straightTop(hand);
  const groups = rankGroups(hand);

  if (flush && top === 14) return HandRank.ROYAL_FLUSH;
  if (flush && top > 0) return HandRank.STRAIGHT_FLUSH;
  if (groups[0].count === 4) return HandRank.FOUR_OF_A_KIND;
  if (groups[0].count === 3 && groups[1].count === 2)
    return HandRank.FULL_HOUSE;
  if (flush) return HandRank.FLUSH;
  if (top > 0) return HandRank.STRAIGHT;
  if (groups[0].count === 3) return HandRank.THREE_OF_A_KIND;
  if (groups[0].count === 2 && groups[1].count === 2) return HandRank.TWO_PAIR;
  if (groups[0].count === 2 && groups[0].rank >= PAIR_QUALIFIER)
    return HandRank.JACKS_OR_BETTER;
  return HandRank.HIGH_CARD;
}

/** Evaluate the best 5 of exactly 5 cards (Hand size is fixed by construction). */
export function evaluate(hand: readonly Card[]): HandResult {
  const rank = rankOf(hand);
  return { rank, label: RANK_LABEL[rank] };
}
