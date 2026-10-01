# Phase 05 — Hold & Draw (complete single hand)

Prerequisite: phase 04. Re-read `docs/phases/00-MASTER-PLAN.md`.

## Goal (the single thing to verify)

The full hand cycle works once, honestly: **DEAL → click cards to toggle HOLD → DRAW replaces exactly the unheld cards → badge names the FINAL hand → NEW HAND resets.** One draw per hand, enforced by the state machine.

## State machine extension (`src/game/reducer.ts`)

```ts
interface GameState { phase: "idle" | "dealt" | "settled"; hand: Card[]; held: boolean[] }  // held: [false×5]
type GameAction = … | { type: "TOGGLE_HOLD"; index: 0|1|2|3|4 } | { type: "DRAW" };
```

- `TOGGLE_HOLD` only in `dealt`; flipping one slot mutates nothing shared (new array).
- `DRAW` only in `dealt`: take a shuffled deck, draw replacements in order for unheld positions, held cards stay in their original slots, `phase → "settled"`. Replacements come from deck positions AFTER the initial 5 (no card can reappear — the deck already excluded the hand; simplest correct impl: deal 10 at DEAL time, use first 5, DRAW takes the next needed from the reserved tail).
- No credits math yet (phase 06). Badge label now describes the settled hand; controls in `settled`: NEW HAND only.

## UI

- `Card.tsx` gains optional `held` + `onToggle`. Held cards: slight lift (`-translate-y-2`), gold ring, and a **HOLD** tab overlay on the card's top edge. Clickable only in `dealt` (set `aria-disabled`, no pointer cursor).
- Controls: `dealt` → gold DRAW (label reads DRAW; count of held shown subtly, e.g. "DRAW 2" if 2 cards replaced — keep it simple, optional); `idle` → DEAL; `settled` → NEW HAND.
- Cards stay static (no animations — phase 07).

## Tests (reducer, deterministic)

- TOGGLE_HOLD round-trips and is ignored in idle/settled
- DRAW with all held → hand unchanged, phase settled
- DRAW with k held → exactly 5-k cards replaced, all 10 cards involved are distinct (pass seeded rng — reducer takes rng via action payload or factory: inject `deck: Card[10]` into DEAL action payload; UI supplies it; reducer stays pure. Update phase-03 tests to pass seeded decks.)
- held resets on NEW_HAND; illegal actions no-op

## Browser check

Play several real hands: hold some, draw, verify drawn cards differ from discarded, held stay, no duplicates in hand, button flow DEAL→DRAW→NEW HAND never offers a wrong action (click everything you shouldn't be able to).

**Commit message:** `feat: ✨ hold and draw complete the single-hand cycle`
**STOP. Fresh session for phase 06.**
