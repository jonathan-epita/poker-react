import { describe, expect, it } from "vitest";

import {
  buildDeck,
  type Card,
  type Rank,
  RANKS,
  shuffle,
  type Suit,
  SUITS,
} from "../engine/cards";
import { HandRank } from "../engine/evaluate";
import { lcg } from "../engine/testing";
import {
  DEAL_SIZE,
  type GameAction,
  gameReducer,
  type GameState,
  initialState,
  isGameOver,
  sessionStats,
  type SettledHand,
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

function c(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

/** Toggle every Hold on — a Draw that stands pat, keeping the dealt Hand. */
function holdAll(state: GameState): GameState {
  let next = state;
  for (const index of [0, 1, 2, 3, 4] as const) {
    next = gameReducer(next, { type: "TOGGLE_HOLD", index });
  }
  return next;
}

/** Deal a by-hand 10-card deck (5 Hand + 5 tail) at the given stake. */
function dealAt(deck: readonly Card[], bet: 1 | 2 | 3 | 4 | 5): GameState {
  const staked = gameReducer(initialState(), { type: "SET_BET", bet });
  return gameReducer(staked, { type: "DEAL", deck: [...deck] });
}

describe("initialState", () => {
  it("is idle with an empty hand, 100 credits, bet 1, no payout, no History", () => {
    expect(initialState()).toEqual({
      phase: "idle",
      hand: [],
      held: [false, false, false, false, false],
      deck: [],
      credits: 100,
      bet: 1,
      lastPayout: 0,
      history: [],
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
  it("transitions dealt → idle, clearing hand and holds but keeping credits", () => {
    const dealt = gameReducer(dealtState(), { type: "TOGGLE_HOLD", index: 4 });

    const idle = gameReducer(dealt, { type: "NEW_HAND" });

    expect(idle).toEqual({ ...initialState(), credits: 99, bet: 1 });
  });

  it("transitions settled → idle — the payout stays banked, the banner clears, the History carries over", () => {
    const dealt = gameReducer(dealtState(), { type: "TOGGLE_HOLD", index: 1 });
    const settled = gameReducer(dealt, { type: "DRAW" });

    const idle = gameReducer(settled, { type: "NEW_HAND" });

    expect(idle).toEqual({
      ...initialState(),
      credits: settled.credits,
      bet: settled.bet,
      history: settled.history,
    });
    expect(idle.held.every((held) => !held)).toBe(true);
  });

  it("is illegal from idle — state returned unchanged", () => {
    const idle = initialState();

    expect(gameReducer(idle, { type: "NEW_HAND" })).toBe(idle);
  });
});

describe("SET_BET", () => {
  it("changes the stake while idle, and the paytable-facing state agrees", () => {
    const staked = gameReducer(initialState(), { type: "SET_BET", bet: 4 });

    expect(staked.bet).toBe(4);
    expect(staked.phase).toBe("idle");
    expect(staked.credits).toBe(100);
  });

  it("clamps to the balance: at 2 credits, 2 is the maximum stake", () => {
    const poor = { ...initialState(), credits: 2 };

    expect(gameReducer(poor, { type: "SET_BET", bet: 2 }).bet).toBe(2);
    for (const bet of [3, 4, 5] as const) {
      expect(gameReducer(poor, { type: "SET_BET", bet })).toBe(poor);
    }
  });

  it("is illegal once a Hand is dealt or settled — state returned unchanged", () => {
    const dealt = dealtState();
    const settled = settledState();

    expect(gameReducer(dealt, { type: "SET_BET", bet: 5 })).toBe(dealt);
    expect(gameReducer(settled, { type: "SET_BET", bet: 5 })).toBe(settled);
  });
});

describe("the economy", () => {
  it("DEAL deducts exactly the bet", () => {
    const dealt = dealAt(seededDeck(11), 3);

    expect(dealt.credits).toBe(97);
    expect(dealt.lastPayout).toBe(0);
  });

  it("DEAL is blocked once the Session cannot stake a single credit", () => {
    const broke = { ...initialState(), credits: 0 };

    expect(gameReducer(broke, { type: "DEAL", deck: seededDeck(5) })).toBe(
      broke,
    );
  });

  it("DRAW pays the final Hand × bet: a pair of kings at stake 3 pays 3", () => {
    // By-hand 10-card deck — five-card Kings hand, five-card filler tail —
    // doubling as an integration test of evaluate × PAYTABLE.
    const kings = [
      c(13, "S"),
      c(13, "H"),
      c(7, "D"),
      c(4, "C"),
      c(9, "H"),
      c(12, "S"),
      c(11, "D"),
      c(10, "S"),
      c(6, "C"),
      c(3, "D"),
    ];

    const settled = gameReducer(holdAll(dealAt(kings, 3)), { type: "DRAW" });

    expect(settled.phase).toBe("settled");
    expect(settled.lastPayout).toBe(3); // JACKS_OR_BETTER (1) × bet 3
    expect(settled.credits).toBe(100); // 100 − 3 dealt + 3 paid
  });

  it("DRAW pays a royal 250 × bet: 98 staked, 598 after", () => {
    const royal = [
      c(10, "S"),
      c(11, "S"),
      c(12, "S"),
      c(13, "S"),
      c(14, "S"),
      c(9, "H"),
      c(8, "D"),
      c(7, "C"),
      c(5, "S"),
      c(3, "H"),
    ];

    const settled = gameReducer(holdAll(dealAt(royal, 2)), { type: "DRAW" });

    expect(settled.lastPayout).toBe(500); // ROYAL_FLUSH (250) × bet 2
    expect(settled.credits).toBe(598);
  });

  it("a no-payout Hand is a net loss of the bet", () => {
    const bust = [
      c(3, "S"),
      c(7, "H"),
      c(11, "D"),
      c(4, "C"),
      c(9, "S"),
      c(2, "H"),
      c(5, "D"),
      c(6, "C"),
      c(8, "S"),
      c(10, "H"),
    ];

    const settled = gameReducer(holdAll(dealAt(bust, 3)), { type: "DRAW" });

    expect(settled.lastPayout).toBe(0);
    expect(settled.credits).toBe(97);
  });

  it("NEW_SESSION resets to exactly 100 credits and bet 1, keeping nothing", () => {
    const kings = dealAt(
      [
        c(13, "S"),
        c(13, "H"),
        c(7, "D"),
        c(4, "C"),
        c(9, "H"),
        c(12, "S"),
        c(11, "D"),
        c(10, "S"),
        c(6, "C"),
        c(3, "D"),
      ],
      5,
    );
    const settled = gameReducer(holdAll(kings), { type: "DRAW" });

    expect(gameReducer(settled, { type: "NEW_SESSION" })).toEqual(
      initialState(),
    );
  });
});

/** Kings at any stake: a settled JACKS_OR_BETTER ledger entry. */
const KINGS: Card[] = [
  c(13, "S"),
  c(13, "H"),
  c(7, "D"),
  c(4, "C"),
  c(9, "H"),
  c(12, "S"),
  c(11, "D"),
  c(10, "S"),
  c(6, "C"),
  c(3, "D"),
];

/** A by-hand High Card: the ledger still records a 0-payout Hand. */
const BUST: Card[] = [
  c(3, "S"),
  c(7, "H"),
  c(11, "D"),
  c(4, "C"),
  c(9, "S"),
  c(2, "H"),
  c(5, "D"),
  c(6, "C"),
  c(8, "S"),
  c(10, "H"),
];

/** A Royal: the ledger's best-possible line, at whatever stake is carried. */
const ROYAL: Card[] = [
  c(10, "S"),
  c(11, "S"),
  c(12, "S"),
  c(13, "S"),
  c(14, "S"),
  c(9, "H"),
  c(8, "D"),
  c(7, "C"),
  c(5, "S"),
  c(3, "H"),
];

describe("the History ledger", () => {
  it("DRAW appends exactly one SettledHand: the settled rank, bet and payout", () => {
    const settled = gameReducer(holdAll(dealAt(KINGS, 3)), { type: "DRAW" });

    expect(settled.history).toEqual([
      { rank: HandRank.JACKS_OR_BETTER, bet: 3, payout: 3 },
    ]);
  });

  it("a silent Settle still writes a line — 0 pays but the Hand counts", () => {
    const settled = gameReducer(holdAll(dealAt(BUST, 3)), { type: "DRAW" });

    expect(settled.history).toEqual([
      { rank: HandRank.HIGH_CARD, bet: 3, payout: 0 },
    ]);
  });

  it("grows one entry per Hand and survives NEW HAND untouched", () => {
    let state = gameReducer(holdAll(dealAt(KINGS, 3)), { type: "DRAW" });
    state = gameReducer(state, { type: "NEW_HAND" });

    expect(state.history).toHaveLength(1);

    state = gameReducer(state, { type: "DEAL", deck: ROYAL });
    state = gameReducer(holdAll(state), { type: "DRAW" });

    expect(state.history).toHaveLength(2);
    expect(state.history[1]).toEqual({
      rank: HandRank.ROYAL_FLUSH,
      bet: 3,
      payout: 750,
    });
  });

  it("is wiped by NEW SESSION along with the credits", () => {
    const settled = gameReducer(holdAll(dealAt(KINGS, 3)), { type: "DRAW" });

    expect(gameReducer(settled, { type: "NEW_SESSION" }).history).toEqual([]);
  });

  it("survives every illegal transition by identity — history included", () => {
    const settled = gameReducer(holdAll(dealAt(KINGS, 3)), { type: "DRAW" });

    expect(gameReducer(settled, { type: "DEAL", deck: seededDeck(99) })).toBe(
      settled,
    );
    expect(gameReducer(settled, { type: "TOGGLE_HOLD", index: 0 })).toBe(
      settled,
    );
    expect(gameReducer(settled, { type: "DRAW" })).toBe(settled);
    expect(gameReducer(settled, { type: "SET_BET", bet: 5 })).toBe(settled);
    // The one legal transition from settled carries the SAME array, not a copy.
    expect(gameReducer(settled, { type: "NEW_HAND" }).history).toBe(
      settled.history,
    );
  });
});

describe("sessionStats (derived)", () => {
  it("reads 0 hands, null best and 0 net on an empty ledger", () => {
    expect(sessionStats(initialState())).toEqual({
      hands: 0,
      best: null,
      net: 0,
    });
  });

  it("one settled Hand at bet 3 paying 3: hands 1, its Rank, net 0", () => {
    const settled = gameReducer(holdAll(dealAt(KINGS, 3)), { type: "DRAW" });

    expect(sessionStats(settled)).toEqual({
      hands: 1,
      best: HandRank.JACKS_OR_BETTER,
      net: 0,
    });
  });

  it("a mixed ledger: best is the enum-minimum Rank, net is signed", () => {
    const history: SettledHand[] = [
      { rank: HandRank.HIGH_CARD, bet: 2, payout: 0 },
      { rank: HandRank.FLUSH, bet: 5, payout: 30 },
      { rank: HandRank.FULL_HOUSE, bet: 1, payout: 9 },
    ];

    expect(sessionStats({ ...initialState(), history })).toEqual({
      hands: 3,
      best: HandRank.FULL_HOUSE,
      net: 31,
    });
  });
});

describe("isGameOver (derived)", () => {
  it("is false while idle and while dealt, whatever the balance", () => {
    expect(isGameOver(initialState())).toBe(false);
    expect(isGameOver({ ...dealtState(), credits: 0 })).toBe(false);
  });

  it("is true only for a settled Hand below one credit", () => {
    expect(isGameOver({ ...settledState(), credits: 4 })).toBe(false);
    expect(isGameOver({ ...settledState(), credits: 1 })).toBe(false);
    expect(isGameOver({ ...settledState(), credits: 0 })).toBe(true);
  });

  it("is never stored on the state", () => {
    const settled = { ...settledState(), credits: 0 };

    expect(settled).not.toHaveProperty("gameOver");
    expect(isGameOver(settled)).toBe(true);
  });
});

describe("unknown actions", () => {
  it("return the state unchanged (referential equality)", () => {
    const state: GameState = initialState();
    const bogus = { type: "HOLD" } as unknown as GameAction;

    expect(gameReducer(state, bogus)).toBe(state);
  });
});
