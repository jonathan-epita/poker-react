import { describe, expect, it } from "vitest";

import {
  RANK_LABEL,
  SUIT_GLYPH,
  buildDeck,
  isRed,
  shuffle,
  type Rank,
  type Suit,
} from "./cards";
import { lcg } from "./testing";

const SUITS: readonly Suit[] = ["S", "H", "D", "C"];
const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const identity = (card: { rank: Rank; suit: Suit }): string =>
  `${card.rank}${card.suit}`;

describe("buildDeck", () => {
  it("returns 52 well-formed, unique cards", () => {
    const deck = buildDeck();

    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(identity)).size).toBe(52);
    for (const card of deck) {
      expect(RANKS).toContain(card.rank);
      expect(SUITS).toContain(card.suit);
      expect(RANK_LABEL[card.rank]).toBeTruthy();
      expect(SUIT_GLYPH[card.suit]).toBeTruthy();
    }
  });

  it("contains every rank in every suit exactly once", () => {
    const seen = new Set(buildDeck().map(identity));

    for (const suit of SUITS) {
      for (const rank of RANKS) {
        expect(seen.has(`${rank}${suit}`)).toBe(true);
      }
    }
  });
});

describe("shuffle", () => {
  it("is a permutation of the input under a seeded rng", () => {
    const deck = buildDeck();
    const shuffled = shuffle(deck, lcg(42));

    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled.map(identity)).size).toBe(52);
    expect([...shuffled.map(identity)].sort()).toEqual(
      [...deck.map(identity)].sort(),
    );
  });

  it("produces an order different from the input", () => {
    const deck = buildDeck();
    const shuffled = shuffle(deck, lcg(42));

    expect(shuffled.map(identity)).not.toEqual(deck.map(identity));
  });

  it("is deterministic for a given seed", () => {
    const deck = buildDeck();

    expect(shuffle(deck, lcg(42)).map(identity)).toEqual(
      shuffle(deck, lcg(42)).map(identity),
    );
  });

  it("does not mutate the input", () => {
    const deck = buildDeck();
    const before = deck.map(identity);

    shuffle(deck, lcg(7));

    expect(deck.map(identity)).toEqual(before);
  });
});

describe("isRed", () => {
  it("maps hearts and diamonds to red", () => {
    expect(isRed("H")).toBe(true);
    expect(isRed("D")).toBe(true);
  });

  it("maps spades and clubs to black", () => {
    expect(isRed("S")).toBe(false);
    expect(isRed("C")).toBe(false);
  });
});
