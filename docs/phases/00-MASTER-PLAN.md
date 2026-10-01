# MASTER PLAN — poker-react

Video poker (Jacks or Better) single-hand arcade game. React + Tailwind, deployed to GitHub Pages.
One-shot game: zero persistence, everything resets on reload or New Session.

This document is the entry point for every agent session. Read it, then read the phase file you are asked to execute.

## What the project is

- **Game**: Jacks or Better video poker. Deal 5 cards → toggle holds → draw once → evaluate → payout. Payout determined solely by the FINAL (post-draw) hand; the post-deal badge is informational. Player may hold all 5.
- **Session economy**: 100 credits at start/restart, bet 1–5 per hand (bet deducted on Deal, payout = paytable value × bet added on settle). Game over when credits < 1 after a settled hand; "New Session" restores 100.
- **Paytable (9/6, credits per credit bet)**: Royal Flush 250 · Straight Flush 50 · Four of a Kind 25 · Full House 9 · Flush 6 · Straight 4 · Three of a Kind 3 · Two Pair 2 · Jacks or Better 1 · everything else 0.
- **Style**: modern casino — dark green felt table, dark rail, gold/amber accents, cream rounded cards, soft shadows. No skeuomorphic textures, no external fonts or assets.

## Target stack (decided — do not re-litigate)

| Concern         | Choice                                                                                                                                                                                | Notes                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Language        | TypeScript 5.9+, `strict: true` + unused/fallthrough flags                                                                                                                            | Foundation conventions                     |
| UI              | React 19                                                                                                                                                                              |                                            |
| Build           | Vite 7, `VITE_BASE_PATH` as the ONE deployment knob                                                                                                                                   | Foundation D8                              |
| Styling         | Tailwind CSS 4 via `@tailwindcss/vite` (CSS-first `@theme`)                                                                                                                           | No tailwind.config.js                      |
| Lint            | ESLint 9 flat config, `typescript-eslint` `recommendedTypeChecked`, `no-explicit-any: error`, `strict-boolean-expressions: error`, `no-shadow: error`; `react-hooks`, `react-refresh` | Disabled rules need in-file rationale      |
| Format          | Prettier + `prettier-plugin-organize-imports` + `@trivago/prettier-plugin-class-attributes` + `prettier-plugin-tailwindcss`                                                           | Deterministic trio, mirrors source project |
| Tests           | Vitest + jsdom + @testing-library/{react,jest-dom,user-event}                                                                                                                         | Engine tested as pure functions            |
| Hooks           | husky + lint-staged (format + typecheck staged)                                                                                                                                       | Foundation checklist #9                    |
| Toolchain truth | `package.json` `engines.node: "22"`, `engines.npm: "11.6.4"` — README and CI read from here ONLY                                                                                      | One version truth                          |
| CI/CD           | `ci.yml` (PR gate) + `deploy.yml` (Pages), SHA-pinned actions, `permissions: {}` default-deny, concurrency cancel                                                                     | Foundation CI-CD                           |
| State           | `useReducer` in App — no Redux/Zustand, no context store                                                                                                                              | Game state is one machine                  |

**Architecture rule (the one that matters):** `src/engine/**` and `src/game/**` are framework-free and import nothing from `react`. Enforced by an ESLint `no-restricted-imports` override on those folders. UI components import game/engine, never the reverse.

**Dependency policy:** every dependency must justify itself. Anything not in the table above requires a one-line justification comment in the PR description.

## Phase sequence

Each phase = ONE functionality, checkable by a human in the browser (or terminal for phases 8–9). Execute strictly in order.

| #   | Phase                                | Browser check                                                              |
| --- | ------------------------------------ | -------------------------------------------------------------------------- |
| 01  | Scaffold + toolchain                 | Styled empty casino table shell renders at `npm run dev`                   |
| 02  | Card engine + static card rendering  | Five beautifully styled cards on the felt (hard-coded hand)                |
| 03  | Deal + New Hand                      | Deal button produces 5 random cards; New Hand re-deals                     |
| 04  | Hand evaluation + paytable panel     | Hand-name badge + paytable with winning row highlighted                    |
| 05  | Hold & Draw                          | Full single-hand cycle: deal → hold → draw → evaluate                      |
| 06  | Credits, betting, payouts, game over | Economy works end-to-end incl. New Session                                 |
| 07  | Animation & polish                   | Deal stagger, card flip, win glow, responsive layout                       |
| 08  | CI + GitHub Pages deploy             | Live site at the Pages URL, ci.yml green on PR                             |
| 09  | Docs finalization + bootstrap report | README/CONTRIBUTING/BOOTSTRAP-REPORT complete, checklist §Validation green |

Phase files: `docs/phases/0N-*.md`. Each is self-contained — a fresh session needs nothing else except the repo itself.

## Context-clear protocol (REQUIRED, from the project owner)

The agent must NOT carry context between phases. At the end of each phase:

1. All browser/terminal checks pass; `npm run check && npm test` green.
2. Commit with the exact Conventional-Commit message given in the phase file.
3. STOP. Do not start the next phase, do not "peek ahead", do not refactor beyond scope.

To start the next phase, the user opens a **fresh session** and sends:

> Read `docs/phases/00-MASTER-PLAN.md` and `docs/phases/0N-<name>.md` in this repo, then execute phase N.

## Working rules (inherited from the foundation)

- Conventional Commits with emoji markers (`feat: ✨`, `fix: 🐛`, `chore: ✂️`, `test: ✅`, `docs: 📝`).
- Vocabulary lives in `docs/CONTEXT.md` — use its exact terms (Hand, Deal, Draw, Hold, Settle…), `_Avoid_` lists are binding.
- No empty directories, no placeholder components for future phases, no commented-out code.
- Deferred designs go in `docs/decisions/` as ADRs or in TECH-DEBT.md, never as stub code.
- Config files stay side-effect-free.
- Tests must be deterministic: `shuffle` takes an injectable `rng` (default `Math.random`); never mock time randomly.

## Banked, not shipped (deliberately out of scope)

- Sound effects (WebAudio click/flip/win) — ADR slot reserved, do not implement.
- Multi-hand strategies, tournaments, localStorage streaks — conflicts with one-shot rule.
- PWA shell, i18n — single language, no offline-install promise needed.
- Playwright E2E — Vitest + testing-library covers the flow at lower cost.
