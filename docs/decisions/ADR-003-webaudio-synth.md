# ADR-003 — Sound: synthesized at the UI seam, silent by default

## Context

Phase 11 un-banked sound (TECH-DEBT #2) under hard constraints: no asset files, no new dependencies, no `<audio>` element, and a one-shot machine that must stay silent unless the player asks otherwise. Autoplay policy also rules: a browser will not let a page make noise before a user gesture, and a machine that throws because a context was blocked is worse than a mute one. The reserved ADR slot (TECH-DEBT #2) is filled by this record.

## Decision

`src/audio.ts` is the sound seam, following the rng pattern: a `Sounder = (sound: Sound) => void` type, a `noopSounder` silence, and a `createSounder(audioContextFactory)` that synthesizes each of the five cues — `deal`, `hold`, `draw`, `win`, `bust` — from oscillators and gain envelopes only (no buffers, no files). The `AudioContext` factory is lazy: it runs on the first cue, which is always a click, and a factory failure permanently silences the sounder instead of throwing. The UI (`App.tsx` only) owns a mute toggle that defaults to **off** and is never persisted; off means the factory is never called. Master gain stays ≤ 0.15.

The seam is deliberately UI-side: `src/engine/**` and `src/game/**` stay audio-free — the Machine's transition table never knows a cue exists. `audio.ts` references the `AudioContext` **type** only, as a browser platform API, not a library.

## Alternatives

1. **Audio asset files** — the honest sound, but breaks the zero-asset rule, adds network weight to a Pages deploy, and hands the build a binary pipeline it does not need.
2. **Sound in the reducer/engine** — a `sound` field on transitions would make cues deterministic state, but it couples the Machine to a presentation concern the machine's rules never mention. Rejected by the architecture rule.
3. **WebAudio with sample buffers** — pre-rendered wavetables in code are still buffers-in-JS: more machinery, no audible payoff at this cue budget.

## Consequences

- The single CSP policy needs **no change**: WebAudio is an in-document platform API driven by the already-allowed `'self'` scripts — no new origins, no media sources. This note exists so nobody widens the CSP by reflex when they see the audio code (ADR-002 remains the only widening).
- Sound is a preference, not a Session: reload returns to silence, honoring the one-shot rule; nothing about the Machine's rules changed.
- `prefers-reduced-motion` does not mute (sound is not motion); cues are kept short and quiet instead.
- The toggle renders `aria-pressed` only while pressed — an absent attribute already reads as unpressed — and steps back with the rail when the overlay owns the machine.
- A platform without WebAudio degrades to `noopSounder` behavior by construction: cues are swallowed, nothing is thrown.
