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
 *
 * The economy rides the same machine: DEAL deducts the bet, DRAW settles the
 * payout (Paytable × bet), and a Session that drops below one credit is over
 * — `isGameOver` derives that from the state, it is never stored. The only
 * way out of a busted Session is NEW SESSION.
 */

import { type Card, buildDeck, shuffle } from "../engine/cards";
import { type HandRank, evaluate } from "../engine/evaluate";
import { payoutFor } from "../engine/paytable";

type GamePhase = "idle" | "dealt" | "settled";

/** Positions in the Hand a Hold can target. */
export type HoldIndex = 0 | 1 | 2 | 3 | 4;

/** The stakes a Bet can take: 1–5 credits per Deal. */
export type Bet = 1 | 2 | 3 | 4 | 5;

/** Every selectable stake, in rail order. */
export const BET_VALUES: readonly Bet[] = [1, 2, 3, 4, 5];

/** Credits a Session starts with — and the only balance NEW SESSION gives. */
const STARTING_CREDITS = 100;

/** One settled Hand on the History ledger: its Rank, its Bet, its Payout. */
export interface SettledHand {
  rank: HandRank;
  bet: Bet;
  payout: number;
}

export interface GameState {
  phase: GamePhase;
  /** The Hand: five cards once dealt, empty while idle. */
  hand: Card[];
  /** One flag per Hand slot: true means the card survives the Draw. */
  held: boolean[];
  /** The reserved Draw tail: deck positions AFTER the initial five. */
  deck: Card[];
  /** Session balance: deducted on Deal, credited on Settle, never stored. */
  credits: number;
  /** Credits staked on the next Deal; never above the balance. */
  bet: Bet;
  /** Credits the last Settle added; 0 until a Hand pays. */
  lastPayout: number;
  /** The Session History: one entry per settled Hand, in-memory only. */
  history: SettledHand[];
}

export type GameAction =
  | { type: "DEAL"; deck: Card[] }
  | { type: "TOGGLE_HOLD"; index: HoldIndex }
  | { type: "DRAW" }
  | { type: "NEW_HAND" }
  | { type: "SET_BET"; bet: Bet }
  | { type: "NEW_SESSION" };

/** Cards per Hand — shared by the Deal and by the empty slots in the UI. */
export const HAND_SIZE = 5;

/** Cards cut at Deal time: the Hand plus an equally sized reserved tail. */
export const DEAL_SIZE = HAND_SIZE * 2;

function emptyHeld(): boolean[] {
  return Array.from({ length: HAND_SIZE }, () => false);
}

export function initialState(): GameState {
  return {
    phase: "idle",
    hand: [],
    held: emptyHeld(),
    deck: [],
    credits: STARTING_CREDITS,
    bet: 1,
    lastPayout: 0,
    history: [],
  };
}

/**
 * Game over is DERIVED, never stored: a settled Hand that left the Session
 * below one credit. The UI shows the overlay exactly when this holds.
 */
export function isGameOver(state: GameState): boolean {
  return state.phase === "settled" && state.credits < 1;
}

/** The derived Session readout: hands played, best Rank seen, net credits. */
export interface SessionStats {
  hands: number;
  /** The best (enum-lowest) Rank settled so far; null while History is empty. */
  best: HandRank | null;
  /** Σ payout − Σ bet over the History, signed. */
  net: number;
}

/**
 * Session statistics, DERIVED from the History and never stored: `hands` is
 * the ledger's length, `best` the lowest `HandRank` seen (the enum is ordered
 * best-first), `net` the signed balance of payouts over bets. The UI renders
 * History only through this selector.
 */
export function sessionStats(state: GameState): SessionStats {
  let best: HandRank | null = null;
  let net = 0;
  for (const settled of state.history) {
    if (best === null || settled.rank < best) best = settled.rank;
    net += settled.payout - settled.bet;
  }
  return { hands: state.history.length, best, net };
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
    case "SET_BET":
      // A Bet is chosen only while idle, and only as far as the balance
      // allows: the clamp happens by refusing the illegal raise outright.
      if (state.phase !== "idle" || action.bet > state.credits) return state;
      return { ...state, bet: action.bet };
    case "DEAL":
      // A Deal is legal only from idle and only while the Session can stake
      // the Bet; the payload's first five cards are the Hand, the rest wait
      // in the tail for the single Draw. The stake leaves the balance now.
      if (state.phase !== "idle" || state.credits < 1) return state;
      return {
        ...state,
        phase: "dealt",
        hand: action.deck.slice(0, HAND_SIZE),
        held: emptyHeld(),
        deck: action.deck.slice(HAND_SIZE),
        credits: state.credits - state.bet,
        lastPayout: 0,
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
      // takes the next reserved replacement in order. The final Hand settles:
      // payout = Paytable × bet, credited AFTER the Deal's deduction, so a
      // no-payout Hand is a net loss of the Bet. The Settle also writes one
      // line to the Session History — the ledger's only home.
      if (state.phase !== "dealt") return state;
      let next = 0;
      const hand = state.hand.map((card, i) =>
        state.held[i] ? card : state.deck[next++],
      );
      const { rank } = evaluate(hand);
      const lastPayout = payoutFor(rank, state.bet);
      return {
        ...state,
        phase: "settled",
        hand,
        lastPayout,
        credits: state.credits + lastPayout,
        history: [
          ...state.history,
          { rank, bet: state.bet, payout: lastPayout },
        ],
      };
    }
    case "NEW_HAND":
      // Back to a fresh idle machine — held and the payout banner reset, but
      // the Session's credits, chosen bet and History carry over. Legal once
      // a Hand is felt.
      if (state.phase === "idle") return state;
      return {
        ...initialState(),
        credits: state.credits,
        bet: state.bet,
        history: state.history,
      };
    case "NEW_SESSION":
      // The only exit from a busted Session: exactly a fresh 100-credit one.
      return initialState();
    default:
      // Unknown actions leave the machine untouched.
      return state;
  }
}
