/**
 * The game machine: a pure transition function over the machine's phases.
 * Framework-free by the same rule as the engine — this layer never imports
 * React (enforced by the ESLint `no-restricted-imports` override).
 *
 * `settled` arrives in phase 05 with the Draw/Settle actions; a phase the
 * machine cannot reach is not declared, so for now it speaks only "idle"
 * and "dealt". Extend the union when phase 05 makes it reachable.
 */

import { type Card, buildDeck, shuffle } from "../engine/cards";

export type GamePhase = "idle" | "dealt";

export interface GameState {
  phase: GamePhase;
  /** The Hand: five cards once dealt, empty while idle. */
  hand: Card[];
}

export type GameAction = { type: "DEAL" } | { type: "NEW_HAND" };

/** Cards per Hand — shared by the Deal and by the empty slots in the UI. */
export const HAND_SIZE = 5;

export function initialState(): GameState {
  return { phase: "idle", hand: [] };
}

/**
 * The complete transition table, as a total function: every illegal action
 * returns the very same state object (referential equality is tested).
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "DEAL":
      // A Deal is legal only from idle; the deck is rebuilt and reshuffled
      // each time, so consecutive Hands never share cards.
      if (state.phase !== "idle") return state;
      return {
        phase: "dealt",
        hand: shuffle(buildDeck(), Math.random).slice(0, HAND_SIZE),
      };
    case "NEW_HAND":
      // Back to a fresh idle machine; legal only once a Hand is on the felt.
      return state.phase === "dealt" ? initialState() : state;
    default:
      // Unknown actions leave the machine untouched.
      return state;
  }
}
