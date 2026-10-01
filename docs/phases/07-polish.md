# Phase 07 — Animation & polish

Prerequisite: phase 06. Re-read `docs/phases/00-MASTER-PLAN.md`.

## Goal (the single thing to verify)

The game **feels** like a machine: cards slide up onto the felt one-by-one (≈60 ms stagger), replaced cards flip, the winning paytable row and the win banner glow, everything is comfortable from 360 px phone to wide desktop. All CSS — zero new dependencies. Respect `prefers-reduced-motion`.

## Spec

- **Deal stagger**: cards animate from `translate-y-6 + opacity-0` in, delay `calc(var(--i)*60ms)`, `--i` inline index. Re-trigger on every DEAL via `key` change.
- **Draw flip**: replaced cards get a `scaleX` flip keyframe (once, 300 ms); held cards don't move.
- **Hold**: lift transition (phase 05) gets `transition-transform`, HOLD tab slides down on toggle.
- **Settle**: payable result → gold `animate-pulse`-style glow on the row + banner (2 cycles then rest via `animation-iteration-count`); use a custom `@keyframes` in CSS, not an arbitrary infinite pulse.
- **Table polish**: felt radial gradient (`--color-felt` → `--color-felt-deep`), subtle inner shadow ring on the rail, gold divider line under the header. Focus-visible rings on all interactive elements (gold, 2 px). Buttons: `aria-pressed` on BET pills, `role="status"` + `aria-live="polite"` on the result banner.
- Layout final: hand centered on felt, paytable right column (desktop) / below (mobile ≤ md), controls always reachable without scrolling on phone.

## Rules

- No animation library. No Web Audio (banked). No refactors of engine/game modules — this phase touches presentation only; if you feel the urge, write an ADR stub note instead.

## Tests

Existing suite must pass unmodified (presentation-only). Add/adjust only where markup changes break queries (prefer stable `getByRole`/text over class selectors so this phase breaks nothing).

## Browser check

Deal 5 hands, hold two, draw: you SEE the stagger, the flip, the glow on a win. Toggle OS reduced-motion → animations collapse to instant. Tab through the whole UI: focus order DEAL → holds → DRAW, rings visible. Phone width: no horizontal scroll, controls above fold.

**Commit message:** `feat: ✨ table animations and layout polish`
**STOP. Fresh session for phase 08.**
