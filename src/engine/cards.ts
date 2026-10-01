/**
 * The card engine: pure data and pure functions. Framework-free by design —
 * this layer (and `src/game/**`) must never import React or touch the DOM.
 *
 * Ranks are numeric (11=J, 12=Q, 13=K, 14=A) so hand evaluation in later
 * phases is arithmetic, not string lookup.
 */

export type Suit = "S" | "H" | "D" | "C";

export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUIT_GLYPH: Record<Suit, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

export const RANK_LABEL: Record<
  Rank,
  "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2"
> = {
  14: "A",
  13: "K",
  12: "Q",
  11: "J",
  10: "10",
  9: "9",
  8: "8",
  7: "7",
  6: "6",
  5: "5",
  4: "4",
  3: "3",
  2: "2",
};

const SUITS: readonly Suit[] = ["S", "H", "D", "C"];

const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/** The 52-card deck in a fixed, deterministic order (suit-major, rank-ascending). */
export function buildDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

/**
 * Fisher–Yates shuffle. The `rng` is a REQUIRED parameter: production callers
 * pass `Math.random`, tests pass a seeded generator (see `testing.ts`), so the
 * engine stays deterministic-under-test without any mocking.
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Hearts and Diamonds are red; Spades and Clubs are black. */
export function isRed(suit: Suit): boolean {
  return suit === "H" || suit === "D";
}
