# Phase 03 — Deal + New Hand

Prerequisite: phase 02. Re-read `docs/phases/00-MASTER-PLAN.md`.

## Goal (the single thing to verify)

Clicking **DEAL** replaces the hard-coded cards with 5 random cards from a freshly shuffled deck; clicking **NEW HAND** clears to a face-down / empty-slot state where only DEAL is available. That's the whole user-visible change. No holds, no credits, no evaluation yet.

## Game state (`src/game/reducer.ts` — pure, framework-free)

```ts
type GamePhase = "idle" | "dealt"; // an unreachable phase must NOT be declared —
//              "settled" arrives in phase 05, when DRAW makes it reachable; extend the union there, not here.
interface GameState {
  phase: GamePhase;
  hand: Card[];
} // hand: [] in idle
type GameAction = { type: "DEAL" } | { type: "NEW_HAND" };
function initialState(): GameState; // { phase: "idle", hand: [] }
function gameReducer(s: GameState, a: GameAction): GameState;
```

- `DEAL` (only from `idle`): `shuffle(buildDeck(), Math.random).slice(0, 5)` → `phase: "dealt"`.
- `NEW_HAND` (from `dealt`): back to `initialState()`.
- Illegal transitions return state unchanged (the reducer is a total function; guard explicitly).

Wiring: `useReducer` in `App.tsx`; controls row under the felt: primary gold button — label switches `DEAL` ⇄ `NEW HAND` from `phase`. In `idle` render 5 empty slots (felt-dark rounded outlines, same aspect as cards) so the layout never jumps.

No credits/bet fields yet — do NOT add them "while you're in there"; phase 06 owns the economy.

## Tests (`src/game/reducer.test.ts`)

- initial state empty hand / idle
- DEAL → dealt, 5 cards, all unique, all well-formed
- repeated DEAL from idle always re-deals (unreachable check where applicable)
- NEW_HAND → idle, hand cleared
- unknown/illegal action returns identical state (referential equality)

## Browser check

Deal 10 hands quickly — cards vary, never duplicate within a hand; New Hand returns to empty slots; single button label flips correctly; no console errors.

**Errata (found in phase 09):** as executed, this phase kept `GamePhase = "idle" | "dealt"` (code block corrected above). Later phases moved randomness out of the reducer: `DEAL` now carries a pre-shuffled `deck` payload and the UI calls `dealDeck(rng)` — see ARCHITECTURE and the phase 05 machine.

**Commit message:** `feat: ✨ deal cycle with game state reducer`
**STOP. Fresh session for phase 04.**
