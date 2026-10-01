/**
 * The game machine: a pure transition function over the machine's phases.
 * Framework-free by the same rule as the engine — this layer never imports
 * React (enforced by the ESLint `no-restricted-imports` override).
 *
 * The full cycle is DEAL → TOGGLE_HOLD… → DRAW → settled → NEW HAND, with
 * exactly one Draw per Deal. The reducer itself performs no randomness: the
 * Deal payload carries ten cards — five for the Hand, five reserved as the
 * Draw tail — so replacement cards can never be ones the Hand already shows.
 * `dealDeck` is the factory the UI uses to build that payload.
 */

import { type Card, buildDeck, shuffle } from "../engine/cards";

export type GamePhase = "idle" | "dealt" | "settled";

/** Positions in the Hand a Hold can target. */
export type HoldIndex = 0 | 1 | 2 | 3 | 4;

export interface GameState {
  phase: GamePhase;
  /** The Hand: five cards once dealt, empty while idle. */
  hand: Card[];
  /** One flag per Hand slot: true means the card survives the Draw. */
  held: boolean[];
  /** The reserved Draw tail: deck positions AFTER the initial five. */
  deck: Card[];
}

export type GameAction =
  | { type: "DEAL"; deck: Card[] }
  | { type: "TOGGLE_HOLD"; index: HoldIndex }
  | { type: "DRAW" }
  | { type: "NEW_HAND" };

/** Cards per Hand — shared by the Deal and by the empty slots in the UI. */
export const HAND_SIZE = 5;

/** Cards cut at Deal time: the Hand plus an equally sized reserved tail. */
export const DEAL_SIZE = HAND_SIZE * 2;

function emptyHeld(): boolean[] {
  return Array.from({ length: HAND_SIZE }, () => false);
}

export function initialState(): GameState {
  return { phase: "idle", hand: [], held: emptyHeld(), deck: [] };
}

/**
 * Cut a fresh DEAL payload: DEAL_SIZE cards off a shuffled deck. The `rng`
 * is injectable so tests stay deterministic; the UI calls it bare.
 */
export function dealDeck(rng: () => number = Math.random): Card[] {
  return shuffle(buildDeck(), rng).slice(0, DEAL_SIZE);
}

/**
 * The complete transition table, as a total function: every illegal action
 * returns the very same state object (referential equality is tested).
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "DEAL":
      // A Deal is legal only from idle; the payload's first five cards are
      // the Hand, the rest wait in the tail for the single Draw.
      if (state.phase !== "idle") return state;
      return {
        phase: "dealt",
        hand: action.deck.slice(0, HAND_SIZE),
        held: emptyHeld(),
        deck: action.deck.slice(HAND_SIZE),
      };
    case "TOGGLE_HOLD":
      // Holds exist only between Deal and Draw. Flipping one slot builds a
      // fresh array — nothing shared with the previous state is mutated.
      if (state.phase !== "dealt") return state;
      return {
        ...state,
        held: state.held.map((held, i) => (i === action.index ? !held : held)),
      };
    case "DRAW": {
      // The single Draw: held cards keep their slots, every unheld slot
      // takes the next reserved replacement in order. Phase settles.
      if (state.phase !== "dealt") return state;
      let next = 0;
      return {
        phase: "settled",
        hand: state.hand.map((card, i) =>
          state.held[i] ? card : state.deck[next++],
        ),
        held: state.held,
        deck: state.deck,
      };
    }
    case "NEW_HAND":
      // Back to a fresh idle machine — held resets; legal once a Hand is felt.
      return state.phase === "idle" ? state : initialState();
    default:
      // Unknown actions leave the machine untouched.
      return state;
  }
}
