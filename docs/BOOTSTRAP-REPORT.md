# BOOTSTRAP-REPORT — what was actually built

Written at the end of phase 09 from the shipped repo (git log, code, CI), not from the plan. The forward-looking classification lives in `docs/BOOTSTRAP-MAPPING.md`; this is the backward-looking receipt.

## Foundation Used

`corpusense-dev` foundation extraction — `foundation/` @ `c7ea5ca` (docs distilled from a production React codebase). Extracted via the project-bootstrapper skill; nine phases executed one per commit (`0c5aad0..0a280ca` + CI comment follow-up).

## Target Stack (as shipped)

TypeScript 5.9 strict · React 19 · Vite 7 · Tailwind CSS 4 (CSS-first `@theme`, no config file) · ESLint 9 flat + typescript-eslint recommendedTypeChecked · Prettier + organize-imports + organize-attributes + tailwindcss plugins · Vitest 4 + jsdom + testing-library · husky + lint-staged. Runtime dependencies: `react`, `react-dom`. Nothing else.

## Architecture (as shipped)

Three layers, two seams, one state machine (`docs/ARCHITECTURE.md`): React leaves render and dispatch; a single `useReducer`/`gameReducer` owns all mutable state; `src/engine/**` is pure, total, zero-dependency. The mechanical rule — ESLint `no-restricted-imports` forbidding `react` imports under `src/engine/**` and `src/game/**` — was written in phase 01 before the folders existed.

## Preserved principles (from the foundation, verbatim in intent)

- **Static client-only SPA on GitHub Pages** — no server, no runtime env reads; `VITE_BASE_PATH` is the one deployment knob, read once in `vite.config.ts`.
- **CI hygiene** — SHA-pinned actions with version comments, `permissions: {}` default-deny, concurrency cancel, `ubuntu-24.04`, `npm ci` with cache. Includes the _correction_ the extraction flagged as the source's #1 absence: a real PR gate (`ci.yml`: check + test + build + prod-audit) backed by branch protection on `main`.
- **Strict-typed core + mechanical layering** — type-aware lint, `no-explicit-any`, and the lint-enforced seam rather than a folder convention trusted to humans.
- **Glossary discipline** — `docs/CONTEXT.md` with binding `_Avoid_` lists and a banked-not-shipped section.
- **Conventional Commits with emoji markers** — all nine commits.
- **Deterministic formatting trio** — same plugin set as the source; no hand-ordering of imports/classes/Tailwind classes.
- **One toolchain truth** — `package.json` `engines`; CI consumes it via `node-version-file`; this README references, never repeats.
- **Pre-commit hooks** — the source's checklist item it was missing; shipped here (lint-staged: format + lint staged).

## Adapted patterns (right-sized, not copied)

| Foundation pattern                                   | Shipped as                                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| State compartments (redux/saga/zustand tripartition) | ONE `useReducer`; the roles survive (authoritative / derived / ephemeral / durable=none), the tools don't fit a 12-field machine |
| Repository/local-DB spine                            | NONE — the one-shot rule deletes the premise; the _seam instinct_ survives as the deck-in-payload reducer                        |
| Test-mode seam (module alias swaps)                  | Injectable `rng` / `dealDeck(rng)` + seeded `lcg` in `src/engine/testing.ts` — deterministic without a mocking library           |
| jsdom stub checklist                                 | Trimmed to jest-dom + restoreMocks; nothing stubbed that no component uses                                                       |
| Validated config accessor                            | Dropped — one config value read once; an accessor module for one variable is the artificial layer                                |

## Source elements not applied (with reasons)

- **D1 local-DB spine / repositories / live queries** — zero durable state by design; there is nothing to persist.
- **D2 Result values + BaseError hierarchy** — its justification is ~200 IO call sites. Here the engine is pure and total: every call succeeds by construction, every reducer action returns. Throw only on programmer error; TypeScript is the error strategy.
- **D3 sagas / supervisors** — no long-lived background flows in a synchronous state machine.
- **D4 factory seam** — nothing to substitute; `shuffle`'s `rng` parameter is the whole seam.
- **D5 plugin registry** — one game, zero extension points.
- **P7 status-law external-job bridge** — no external jobs.
- **i18n / PWA / P12 chunk-splitting / P10 provenance stamping** — single-language toy, no offline promise, no heavy separable library, a game doesn't show its git hash.

## New architectural decisions (invented here, not inherited)

1. **Arcade payout rule** — final hand pays, deal badge is informational → ADR-001.
2. **Deck-in-action-payload** — DEAL carries 10 pre-shuffled cards so the reducer stays pure and re-appearance of held cards is structurally impossible; randomness enters only via `dealDeck(rng)`.
3. **Framework-free engine enforced by lint, not review** — the override landed before the folders.
4. **Paytable as data** — the 9/6 table exists exactly once (`engine/paytable.ts`); panel and payouts both render/call from it, and a test pins it to the master plan.
5. **Game over is derived, never stored** — `isGameOver(state)`; a test asserts the field never exists.

## Testing (as shipped)

6 files, 81 tests: engine full-branch (every `HandRank`, both wheel and Broadway straights, every suit colour), paytable pinned to the plan and monotone by rank, reducer as a complete transition table (every illegal action asserted by referential equality), the economy (deduct/payout/clamp/bust/New Session), and one user-event flow test (`App.test.tsx`) driving deal → hold → draw → settle → bust → NEW SESSION. Randomness is seeded (`lcg`), never mocked.

## Security

No secrets by construction (no tokens, no storage). CSP shipped as a `<meta>` on Pages with `'self'` everywhere; `style-src 'unsafe-inline'` is the single widening, documented in ADR-002. CSP lives as a `<meta>` (Pages cannot set response headers) — recorded in TECH-DEBT.

## Observability

Dev console only. One-shot toy, static host, no telemetry target — an error-reporting seam would need a service the project promises not to have. One-line rationale, deliberately no code.

## Initial tech debt

See `docs/TECH-DEBT.md`: no E2E (Playwright banked), sound banked, no bet-history UI, CSS-only animations, meta-CSP limitation.

## Known limitations

Jacks-or-Better only; 9/6 paytable fixed; bet cap 5; single language; no hand history. All deliberate — `docs/CONTEXT.md` "Banked, not shipped".

## Next steps

Nothing scheduled — the one-shot game is feature-complete by plan. If it grows: sound is the first ADR slot to fill, Playwright the first CI addition.
