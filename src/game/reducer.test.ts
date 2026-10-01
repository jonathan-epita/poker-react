import { describe, expect, it } from "vitest";

import { type Card, RANKS, SUITS, buildDeck, shuffle } from "../engine/cards";
import { lcg } from "../engine/testing";
import {
  DEAL_SIZE,
  type GameAction,
  type GameState,
  gameReducer,
  initialState,
} from "./reducer";

/**
 * The reducer is pure — the Deal payload carries the cards — so tests pass
 * seeded decks built with the same engine helpers the UI uses.
 */
function seededDeck(seed: number): Card[] {
  return shuffle(buildDeck(), lcg(seed)).slice(0, DEAL_SIZE);
}

function dealtState(seed = 42): GameState {
  return gameReducer(initialState(), { type: "DEAL", deck: seededDeck(seed) });
}

function settledState(seed = 42): GameState {
  return gameReducer(dealtState(seed), { type: "DRAW" });
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function expectWellFormedCard(card: Card): void {
  expect(SUITS).toContain(card.suit);
  expect(RANKS).toContain(card.rank);
}

describe("initialState", () => {
  it("is idle with an empty hand, nothing held and no reserved tail", () => {
    expect(initialState()).toEqual({
      phase: "idle",
      hand: [],
      held: [false, false, false, false, false],
      deck: [],
    });
  });
});

describe("DEAL", () => {
  it("transitions idle → dealt: first five payload cards on the felt", () => {
    const deck = seededDeck(42);
    const state = gameReducer(initialState(), { type: "DEAL", deck });

    expect(state.phase).toBe("dealt");
    expect(state.hand).toEqual(deck.slice(0, 5));
    expect(state.deck).toEqual(deck.slice(5));
    for (const card of state.hand) expectWellFormedCard(card);
    expect(state.held).toEqual([false, false, false, false, false]);
  });

  it("deals 5 unique cards — a hand never repeats a card", () => {
    const { hand } = dealtState();
    const keys = hand.map(cardKey);

    expect(new Set(keys).size).toBe(5);
  });

  it("is illegal from dealt and settled — state returned unchanged", () => {
    const dealt = dealtState();
    const settled = settledState();
    const deck = seededDeck(99);

    expect(gameReducer(dealt, { type: "DEAL", deck })).toBe(dealt);
    expect(gameReducer(settled, { type: "DEAL", deck })).toBe(settled);
  });
});

describe("TOGGLE_HOLD", () => {
  it("round-trips: flip, flip back — same held values, mutated by nobody", () => {
    const dealt = dealtState();

    const once = gameReducer(dealt, { type: "TOGGLE_HOLD", index: 2 });
    const twice = gameReducer(once, { type: "TOGGLE_HOLD", index: 2 });

    expect(once.held).toEqual([false, false, true, false, false]);
    expect(twice.held).toEqual(dealt.held);
    // New arrays all the way down — the previous state is never mutated.
    expect(once.held).not.toBe(dealt.held);
    expect(dealt.held).toEqual([false, false, false, false, false]);
    expect(once.hand).toBe(dealt.hand);
  });

  it("flips exactly one slot and leaves the phase and hand alone", () => {
    const heldOne = gameReducer(dealtState(), {
      type: "TOGGLE_HOLD",
      index: 0,
    });

    expect(heldOne.held).toEqual([true, false, false, false, false]);
    expect(heldOne.phase).toBe("dealt");
  });

  it("is ignored in idle and settled — state returned unchanged", () => {
    const idle = initialState();
    const settled = settledState();

    expect(gameReducer(idle, { type: "TOGGLE_HOLD", index: 0 })).toBe(idle);
    expect(gameReducer(settled, { type: "TOGGLE_HOLD", index: 0 })).toBe(
      settled,
    );
  });
});

describe("DRAW", () => {
  it("with all five held → the Hand is unchanged, the phase settles", () => {
    let allHeld = dealtState();
    for (const index of [0, 1, 2, 3, 4] as const) {
      allHeld = gameReducer(allHeld, { type: "TOGGLE_HOLD", index });
    }

    const settled = gameReducer(allHeld, { type: "DRAW" });

    expect(settled.phase).toBe("settled");
    expect(settled.hand).toEqual(allHeld.hand);
  });

  it("with k held → exactly the unheld slots are replaced, held keep their slots", () => {
    const dealt = dealtState(7);
    const hold0 = gameReducer(dealt, { type: "TOGGLE_HOLD", index: 0 });
    const hold02 = gameReducer(hold0, { type: "TOGGLE_HOLD", index: 2 });

    const settled = gameReducer(hold02, { type: "DRAW" });

    expect(settled.phase).toBe("settled");
    expect(settled.hand).toHaveLength(5);
    expect(settled.hand[0]).toEqual(dealt.hand[0]); // held
    expect(settled.hand[2]).toEqual(dealt.hand[2]); // held
    for (const i of [1, 3, 4]) {
      expect(settled.hand[i]).not.toEqual(dealt.hand[i]); // drawn
      expectWellFormedCard(settled.hand[i]);
    }
  });

  it("takes replacements from the reserved tail, in order — all 10 cards distinct", () => {
    const dealt = dealtState(123);
    const hold0 = gameReducer(dealt, { type: "TOGGLE_HOLD", index: 0 });

    const settled = gameReducer(hold0, { type: "DRAW" });

    // Unheld slots consume the tail in order: slot 1→tail[0], 2→tail[1], …
    expect(settled.hand.slice(1)).toEqual(dealt.deck.slice(0, 4));
    const ten = [...dealt.hand, ...dealt.deck].map(cardKey);
    expect(new Set(ten).size).toBe(10);
  });

  it("is illegal in idle and settled — state returned unchanged", () => {
    const idle = initialState();
    const settled = settledState();

    expect(gameReducer(idle, { type: "DRAW" })).toBe(idle);
    expect(gameReducer(settled, { type: "DRAW" })).toBe(settled);
  });
});

describe("NEW_HAND", () => {
  it("transitions dealt → idle and clears hand, holds and tail", () => {
    const dealt = gameReducer(dealtState(), { type: "TOGGLE_HOLD", index: 4 });

    expect(gameReducer(dealt, { type: "NEW_HAND" })).toEqual(initialState());
  });

  it("transitions settled → idle — held resets with the machine", () => {
    const dealt = gameReducer(dealtState(), { type: "TOGGLE_HOLD", index: 1 });
    const settled = gameReducer(dealt, { type: "DRAW" });

    const idle = gameReducer(settled, { type: "NEW_HAND" });

    expect(idle).toEqual(initialState());
    expect(idle.held.every((held) => !held)).toBe(true);
  });

  it("is illegal from idle — state returned unchanged", () => {
    const idle = initialState();

    expect(gameReducer(idle, { type: "NEW_HAND" })).toBe(idle);
  });
});

describe("unknown actions", () => {
  it("return the state unchanged (referential equality)", () => {
    const state: GameState = initialState();
    const bogus = { type: "HOLD" } as unknown as GameAction;

    expect(gameReducer(state, bogus)).toBe(state);
  });
});
