import { describe, expect, it } from "vitest";

import { HandRank } from "./evaluate";
import { PAYTABLE, payoutFor } from "./paytable";

/** The MASTER PLAN table, restated here as the independent oracle. */
const EXPECTED: Record<HandRank, number> = {
  [HandRank.ROYAL_FLUSH]: 250,
  [HandRank.STRAIGHT_FLUSH]: 50,
  [HandRank.FOUR_OF_A_KIND]: 25,
  [HandRank.FULL_HOUSE]: 9,
  [HandRank.FLUSH]: 6,
  [HandRank.STRAIGHT]: 4,
  [HandRank.THREE_OF_A_KIND]: 3,
  [HandRank.TWO_PAIR]: 2,
  [HandRank.JACKS_OR_BETTER]: 1,
  [HandRank.HIGH_CARD]: 0,
};

const ALL_RANKS = Object.values(HandRank).filter(
  (value): value is HandRank => typeof value === "number",
);

describe("PAYTABLE", () => {
  it("maps every Rank, and nothing else", () => {
    for (const rank of ALL_RANKS) {
      expect(PAYTABLE.get(rank)).toBeDefined();
    }
    expect(PAYTABLE.size).toBe(ALL_RANKS.length);
  });

  it("carries exactly the 9/6 values of the MASTER PLAN", () => {
    for (const rank of ALL_RANKS) {
      expect(PAYTABLE.get(rank)).toBe(EXPECTED[rank]);
    }
  });

  it("pays strictly in RANK order, best first", () => {
    const payouts = ALL_RANKS.map((rank) => PAYTABLE.get(rank) as number);
    const sorted = [...payouts].sort((a, b) => b - a);
    expect(payouts).toEqual(sorted);
  });
});

describe("payoutFor", () => {
  it("is the table value times the bet", () => {
    expect(payoutFor(HandRank.ROYAL_FLUSH, 1)).toBe(250);
    expect(payoutFor(HandRank.FULL_HOUSE, 5)).toBe(45);
    expect(payoutFor(HandRank.JACKS_OR_BETTER, 3)).toBe(3);
    expect(payoutFor(HandRank.HIGH_CARD, 5)).toBe(0);
  });

  it("scales linearly with the bet for every Rank", () => {
    for (const rank of ALL_RANKS) {
      for (const bet of [1, 2, 3, 4, 5]) {
        expect(payoutFor(rank, bet)).toBe(payoutFor(rank, 1) * bet);
      }
    }
  });
});
