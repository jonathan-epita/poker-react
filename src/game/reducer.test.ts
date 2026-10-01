import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Card, RANKS, SUITS } from "../engine/cards";
import { lcg } from "../engine/testing";
import {
  type GameAction,
  type GameState,
  gameReducer,
  initialState,
} from "./reducer";

/**
 * The reducer calls `shuffle(deck, Math.random)`, so tests install a seeded
 * lcg into `Math.random` — deterministic deals without mocking the engine.
 */
function seedRng(seed: number) {
  vi.spyOn(Math, "random").mockImplementation(lcg(seed));
}

function dealtHand(): GameState {
  return gameReducer(initialState(), { type: "DEAL" });
}

function expectWellFormedCard(card: Card): void {
  expect(SUITS).toContain(card.suit);
  expect(RANKS).toContain(card.rank);
}

describe("initialState", () => {
  it("is idle with an empty hand", () => {
    expect(initialState()).toEqual({ phase: "idle", hand: [] });
  });
});

describe("DEAL", () => {
  beforeEach(() => seedRng(42));

  it("transitions idle → dealt with 5 well-formed cards", () => {
    const state = dealtHand();

    expect(state.phase).toBe("dealt");
    expect(state.hand).toHaveLength(5);
    for (const card of state.hand) expectWellFormedCard(card);
  });

  it("deals 5 unique cards — a hand never repeats a card", () => {
    const { hand } = dealtHand();
    const keys = hand.map((card) => `${card.rank}${card.suit}`);

    expect(new Set(keys).size).toBe(5);
  });

  it("re-deals from idle — each Deal shuffles a fresh deck", () => {
    const first = dealtHand();

    seedRng(7);
    const second = dealtHand();

    expect(second.phase).toBe("dealt");
    expect(second.hand).not.toEqual(first.hand);
  });

  it("is illegal from dealt — state returned unchanged", () => {
    const dealt = dealtHand();

    expect(gameReducer(dealt, { type: "DEAL" })).toBe(dealt);
  });
});

describe("NEW_HAND", () => {
  beforeEach(() => seedRng(42));

  it("transitions dealt → idle and clears the hand", () => {
    const dealt = dealtHand();

    expect(gameReducer(dealt, { type: "NEW_HAND" })).toEqual(initialState());
  });

  it("is illegal from idle — state returned unchanged", () => {
    const idle = initialState();

    expect(gameReducer(idle, { type: "NEW_HAND" })).toBe(idle);
  });
});

describe("unknown actions", () => {
  it("return the state unchanged (referential equality)", () => {
    const state: GameState = { phase: "idle", hand: [] };
    const bogus = { type: "HOLD" } as unknown as GameAction;

    expect(gameReducer(state, bogus)).toBe(state);
  });
});
