# Phase 11 — Synthesized sound effects

Prerequisite: phase 10. Re-read `docs/phases/00-MASTER-PLAN.md`. Clears TECH-DEBT #2 — update that entry to `Resolved by phase 11`, fill the reserved ADR slot with `docs/decisions/ADR-003-webaudio-synth.md`, and remove sound from the "Banked, not shipped" lists (master plan + CONTEXT.md), all in the same commit.

## Goal (the single thing to verify)

The machine **makes noise**: Deal ticks, holds click, the Draw whooshes, a win jingles, a bust thuds — all synthesized by WebAudio in under ~120 ms per cue, zero audio files, zero new dependencies. Sound is off by default and the toggle is one gold button.

## Spec

- **`src/audio.ts` — the seam (same pattern as the rng):** export `type Sound = "deal" | "hold" | "draw" | "win" | "bust"`; export `type Sounder = (sound: Sound) => void`; export `noopSounder: Sounder` (the no-op default) and `createSounder(audioContext: () => AudioContext): Sounder` which synthesizes each cue with oscillators + gain envelopes (no buffers, no files). Every cue is a pure function of the event — no state, no scheduling between cues, overlapping cues are fine.
  - `deal`: five short woodblock-ish ticks at 60 ms spacing — same cadence as the visual stagger.
  - `hold` / toggle-off: one ~800 Hz click (one synth cue covers both directions).
  - `draw`: a filtered noise-ish sweep ≈ card flip.
  - `win`: a 3-note ascending major arpeggio, gold-plated.
  - `bust`: one low descending thud on game over.
  - Keep the module import-free of React (engine-adjacent by the architecture rule; it may reference the `AudioContext` type since it's a browser platform API).
- **Wiring (`App.tsx` only):** a `sounder` prop defaulting to a lazily-created WebAudio sounder (`new AudioContext()` on FIRST cue — the click on DEAL/SET_BET is the user gesture that satisfies autoplay policy; creation failure falls back to `noopSounder`). Fire at the dispatch points the animation layer already uses: `deal` beside the epoch bump, `hold` in the hold toggle callback, `draw` where `flipped` is snapshotted, `win`/`bust` on the Settle transition (`lastPayout > 0` / `isGameOver`). One call site per cue; no re-firing on re-render (`useEffect`/ref guard if needed).
- **Mute toggle:** gold icon button (speaker glyphs via inline SVG, no icon library) left of CREDITS, `aria-pressed` + accessible name "Sound". State is a `useState` defaulting to **off**, not persisted — reload returns to off, one-shot rule intact. Off means: no AudioContext is ever constructed.
- **CSP:** WebAudio needs no policy change (`'self'` scripts only); note this in ADR-003 so nobody widens the CSP by reflex.

## Rules

- Zero new dependencies (justify-free), zero asset files, no `<audio>` element.
- `src/game/**` and `src/engine/**` stay React-free AND audio-free: sound is chosen at the UI seam, the Machine's transition table never knows about it.
- Respect the spirit of reduced-motion: `prefers-reduced-motion` does NOT mute (that's motion), but keep every cue short and quiet (master gain ≤ 0.15).

## Tests

- `audio.test.ts`: with a stubbed `AudioContext` (hand-rolled fake recording `createOscillator`/`createGain`/`connect`/frequency calls), `createSounder` schedules ≥ 1 node per cue, `deal` schedules five ticks, the factory throws → `noopSounder` behavior (nothing thrown). No jsdom AudioContext assumptions.
- `App.test.tsx`: inject a `vi.fn()` sounder; assert DEAL fires `deal`, hold toggle fires `hold`, DRAW fires `draw`, a payable Settle fires `win`, bust fires `bust`, and a non-payable Settle fires neither `win` nor `bust`. Existing tests must otherwise pass unmodified.

## Browser check

Mute off → DEAL: you hear the five ticks in stagger time. Toggle a hold: click. DRAW: sweep, then win jingle on a payable hand. Bust to 0: thud under the overlay. Toggle sound on/off mid-Session — instant, silent, no console errors, `npm run check && npm test` green, CSP untouched.

**Commit message:** `feat: ✨ synthesized sound effects`
**STOP. Fresh session for phase 12.**
