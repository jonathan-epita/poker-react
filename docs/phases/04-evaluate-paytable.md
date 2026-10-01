# Phase 04 — Hand evaluation + paytable panel

Prerequisite: phase 03. Re-read `docs/phases/00-MASTER-PLAN.md`.

## Goal (the single thing to verify)

After dealing, the UI **names the hand** (gold badge over the hand area) and the **paytable panel** (side of the felt) lists all 9 Jacks-or-Better ranks with payouts; the row matching the current hand is highlighted in gold — but ONLY when the row actually pays (a losing High Card highlights nothing). Still no holds/draw/payout: the badge is informational (labelled, e.g. small caption "draw to try for a payout").

## Engine spec (`src/engine/evaluate.ts`, `src/engine/paytable.ts`)

```ts
enum HandRank {
  ROYAL_FLUSH,
  STRAIGHT_FLUSH,
  FOUR_OF_A_KIND,
  FULL_HOUSE,
  FLUSH,
  STRAIGHT,
  THREE_OF_A_KIND,
  TWO_PAIR,
  JACKS_OR_BETTER,
  HIGH_CARD,
}
function evaluate(hand: readonly Card[]): { rank: HandRank; label: string };
```

Rules (exactly once, no duplication):

- Royal = straight flush ending at Ace(14). Ace-low wheel straight allowed (A-2-3-4-5, top card 5). No wraparound.
- JACKS_OR_BETTER = best pair is J/Q/K/A (a 10-pair or lower is HIGH_CARD → payout 0).
- Evaluate the best 5 of exactly 5 cards (hand size is always 5 by construction).

```ts
const PAYTABLE: ReadonlyMap<HandRank, number>; // 250/50/25/9/6/4/3/2/1/0 per MASTER PLAN
function payoutFor(rank: HandRank, bet: number): number; // table × bet; bet field used from phase 06 — keep param
```

Derivation, not state: components compute `evaluate(hand)` at render from `state.hand`. Do NOT store the result in the reducer.

## Components

- `ResultBadge.tsx` — gold-bordered pill, `label` from `evaluate`, hidden when hand empty.
- `Paytable.tsx` — rows (label left, payout right, monospace tabular numbers), current payable rank gets gold bg; use `PAYTABLE` + `RANK_LABEL`, no literals duplicated.
- Layout: paytable to the right of the hand on desktop, below on mobile.

## Tests

`evaluate.test.ts` — one+ cases per rank incl.: wheel straight, royal vs king-high straight-flush distinction, full house vs four-kind on near-misses, pair-of-10 → HIGH_CARD, pair-of-Jacks → JACKS_OR_BETTER, two pair + kicker ≠ trips. `paytable.test.ts` — every rank mapped, payout scales with bet. Reducer untouched (assert its tests still pass unmodified).

## Browser check

Deal repeatedly; the badge always matches the visible cards (verify ~6 hands by eye); a payable hand highlights exactly one paytable row; reloads keep the paytable identical (it's static config).

**Commit message:** `feat: ✨ hand evaluation and paytable panel`
**STOP. Fresh session for phase 05.**
