# TECH-DEBT

Honest ledger of what this project carries on purpose. Each entry: problem, impact, why it stands, a way out, priority.

## 1. No E2E browser tests

- **Problem:** The user-visible flow is verified by testing-library in jsdom plus human browser checks per phase; no real-browser run.
- **Impact:** A browser-only regression (CSS-only breakage, Pages base-path mistake, CSP violation) reaches `main` green. CI's build step catches asset-path issues; it cannot catch rendering ones.
- **Reason:** Playwright was banked in the master plan — Vitest + testing-library covers the state-machine-heavy logic at a fraction of the cost for a 3-phase game.
- **Potential solution:** `@playwright/test` smoke spec (deal → hold → draw → settle) against `preview`, headless chromium only, as a third CI job.
- **Priority:** Low while the feature set is frozen; High the day anything about layout or the CSP changes. **Planned: phase 12.**

## 2. Sound effects banked, not shipped — Resolved by phase 11

- **Problem:** A video-poker machine without a click/flip/win sound is a silent slot.
- **Impact:** Purely experiential; zero functional cost.
- **Reason:** Banked in the master plan — no external assets allowed and a WebAudio synth is a phase-sized task out of scope for 9 phases. ADR slot reserved, deliberately unfilled.
- **Resolution:** Phase 11 shipped it — `src/audio.ts` synthesizes every cue (deal ticks, hold click, draw sweep, win arpeggio, bust thud) from oscillators and gain envelopes behind a `Sounder` seam mirroring the rng pattern: zero assets, zero dependencies, off by default behind one gold toggle. Wired at the same dispatch points the animations use; the Machine never knows about sound. Recorded in ADR-003.
- **Priority:** Resolved by phase 11.

## 3. No bet-history / stats UI — Resolved by phase 10

- **Problem:** After a Session, players cannot see hands played, best hand, or net — the ledger lives nowhere.
- **Impact:** No long-term engagement hook; no way to verify "the paytable is fair" from inside the machine.
- **Reason:** The one-shot promise forbids persistence; a transient in-memory history is possible but was never scoped — every phase file checked, none owns it.
- **Resolution:** Phase 10 shipped it — `history: SettledHand[]` in the reducer (still zero-persistence: reload or NEW SESSION wipes it), the derived `sessionStats` selector, and a thin one-line History rail beside CREDITS. Machine rules unchanged.
- **Priority:** Resolved by phase 10.

## 4. Animations are CSS keyframes only

- **Problem:** Deal stagger, flip, and settle glow are `@theme` keyframes; no animation library or WAAPI orchestration.
- **Impact:** No interruptibility (re-dealing mid-animation replays rather than retargets), the glow's two-cycle rest is timing-trusted, and reduced-motion support is a `@media` opt-out rather than per-motion control.
- **Reason:** Phase 07 chose zero-dependency CSS deliberately; the animations are finite and cosmetic.
- **Potential solution:** Web Animations API behind a tiny `useAnimation` hook if interruptions ever feel wrong; no library.
- **Priority:** Low.

## 5. CSP ships as `<meta>`, not HTTP header

- **Problem:** GitHub Pages serves static files with fixed headers; the CSP lives in an `index.html` `<meta http-equiv>` tag.
- **Impact:** Meta-CSP cannot use `frame-ancestors`, `sandbox`, or `report-uri`; an HTML-injection flaw would land in the same document as the policy it violates.
- **Reason:** No server, by design. The policy is trivially strict (`'self'` + the documented inline-style widening) and the document content is build-time static.
- **Potential solution:** If ever fronted by a worker/CDN, promote the same policy to a response header and keep the meta as fallback.
- **Priority:** Low (accepted with ADR-002).
