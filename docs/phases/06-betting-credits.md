# Phase 06 — Credits, betting, payouts, game over

Prerequisite: phase 05. Re-read `docs/phases/00-MASTER-PLAN.md`.

## Goal (the single thing to verify)

The economy works: **100 credits, bet 1–5, DEAL deducts bet, DRAW pays out final hand × bet, game-over banner at < 1 credit, NEW SESSION restores 100.** Play a few hands and the numbers must reconcile exactly.

## State extension (`src/game/reducer.ts`)

```ts
interface GameState { phase; hand; held; credits: number; bet: number; lastPayout: number }
type GameAction = … | { type: "SET_BET"; bet: 1|2|3|4|5 }
```

- `initialState()`: credits 100, bet 1, lastPayout 0.
- `SET_BET` only in `idle`; clamp `bet ≤ credits`; current bet can't be raised above remaining credits.
- `DEAL`: requires `phase idle && credits ≥ 1` → `credits −= bet`, reserve 10-card deck (phase 05 seam), phase `dealt`.
- `DRAW`: `lastPayout = payoutFor(evaluate(finalHand).rank, bet)`; `credits += lastPayout`; phase `settled`. (Payout added AFTER deduction — net loss when payout < bet. Game-over flag = `phase settled && credits < 1` — derive it, don't store it.)
- `NEW_HAND` keeps credits/bet; new action `NEW_SESSION` → `initialState()`.

Paytable panel: switch payouts to credits-per-credit-bet × current bet (row values update with bet, tabular-nums).

## UI

- Top rail: CREDITS display (gold, large, monospace) and a BET selector — five pill buttons 1..5, active one gold-filled, disabled when > credits.
- Settled banner: `RESULT — {label} · +{lastPayout}` (win, gold glow) / `{label} · no payout` (dim). Caption stays informational per banked rule: final hand only pays.
- Game over: full-felt overlay — "GAME OVER", final credits, NEW SESSION button (only action).
- `lastPayout` shown in banner, cleared to 0 on NEW_HAND.

## Tests

reducer: deal deducts exactly bet; draw adds payoutFor(final, bet) (seeded decks with known outcomes: pair-of-kings pays 1×bet, royal pays 250×bet — build the 10-card deck by hand, this doubles as a paytable integration test); SET_BET clamping incl. credits=2 → max bet 2; DEAL blocked at credits 0; NEW_SESSION resets to exactly 100/1 while keeping nothing else. Component: game-over overlay appears only when settled & credits<1 and exposes only NEW SESSION.

## Browser check

Play deliberately: max bet on a guaranteed-ish draw (hold a 4-flush); watch CREDITS tick down on Deal and the banner show the exact win; bet buttons grey out beyond credits; go bust (bet 1, fold-pace) → overlay; New Session returns to 100. Arithmetic reconciles across reload-free session.

**Commit message:** `feat: ✨ credit economy with betting and payouts`
**STOP. Fresh session for phase 07.**
