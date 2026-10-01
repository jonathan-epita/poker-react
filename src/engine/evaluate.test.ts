import { describe, expect, it } from "vitest";

import { type Card, type Rank, type Suit } from "./cards";
import { HandRank, RANK_LABEL, evaluate } from "./evaluate";

/**
 * Poker-notation hands — rank letter then suit letter, space-separated — so
 * the cases read like poker rather than like data structures.
 */
const SUIT_BY_LETTER: Record<string, Suit | undefined> = {
  s: "S",
  h: "H",
  d: "D",
  c: "C",
};
const RANK_BY_LETTER: Record<string, Rank | undefined> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  t: 10,
  j: 11,
  q: 12,
  k: 13,
  a: 14,
};

function hand(notation: string): Card[] {
  return notation.split(" ").map((token) => {
    const suit = SUIT_BY_LETTER[token.slice(-1)];
    const rank = RANK_BY_LETTER[token.slice(0, -1)];
    // Fail loudly: a silently-NaN rank evaluates as garbage, never as a hint.
    if (suit === undefined || rank === undefined)
      throw new Error(`invalid card token: ${token}`);
    return { rank, suit };
  });
}

function rankOf(notation: string): HandRank {
  return evaluate(hand(notation)).rank;
}

const CASES: ReadonlyArray<readonly [string, HandRank]> = [
  // Royal = straight flush ending at Ace(14), the top of the Paytable.
  ["ts js qs ks as", HandRank.ROYAL_FLUSH],
  // King-high straight flush is NOT a royal — the distinction matters.
  ["9s ts js qs ks", HandRank.STRAIGHT_FLUSH],
  // The wheel flush: ace low, top card 5 → straight flush, not royal.
  ["as 2s 3s 4s 5s", HandRank.STRAIGHT_FLUSH],
  // The wheel straight, mixed suits.
  ["ah 2s 3c 4d 5c", HandRank.STRAIGHT],
  ["5h 6s 7c 8d 9c", HandRank.STRAIGHT],
  ["th js qc kd ac", HandRank.STRAIGHT],
  // No wraparound: Q-K-A-2-3 is not a straight.
  ["qh ks ah 2c 3d", HandRank.HIGH_CARD],
  ["kh ah 2c 3d 4s", HandRank.HIGH_CARD],
  ["jh qs ks as 9c", HandRank.HIGH_CARD],
  ["kh 9h jh th 8h", HandRank.FLUSH],
  ["7h 7s 7c 7d 2h", HandRank.FOUR_OF_A_KIND],
  ["2h 2s 2c 2d as", HandRank.FOUR_OF_A_KIND],
  // Near-misses keep the ranks apart: 3+2 is a full house, 3+1+1 is trips.
  ["7h 7s 7c 2d 2s", HandRank.FULL_HOUSE],
  ["7h 7s 7c 2d 3s", HandRank.THREE_OF_A_KIND],
  // Two pair with a kicker is still two pair — a kicker is not a third group.
  ["7h 7s 2c 2d ah", HandRank.TWO_PAIR],
  ["ah as kh kd 3c", HandRank.TWO_PAIR],
  // Qualifying pair: J or better pays; a 10-pair or lower is High Card.
  ["jh js 5c 9d kc", HandRank.JACKS_OR_BETTER],
  ["qh qs 2c 5d 9h", HandRank.JACKS_OR_BETTER],
  ["kh ks 9c 5d 2h", HandRank.JACKS_OR_BETTER],
  ["th ts 2c 5d 9h", HandRank.HIGH_CARD],
  ["9h 9s 2c 5d th", HandRank.HIGH_CARD],
  ["ah ks 5d 9c 2h", HandRank.HIGH_CARD],
];

describe("evaluate", () => {
  it.each(CASES)("evaluates %s as %s", (notation, expected) => {
    expect(rankOf(notation)).toBe(expected);
  });

  it("labels every result from RANK_LABEL, never a literal", () => {
    for (const [notation, expected] of CASES) {
      const result = evaluate(hand(notation));
      expect(result.rank).toBe(expected);
      expect(result.label).toBe(RANK_LABEL[expected]);
    }
  });

  it("evaluates a royal identically in any suit", () => {
    expect(rankOf("th jh qh kh ah")).toBe(rankOf("ts js qs ks as"));
  });
});
