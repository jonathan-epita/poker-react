# Phase 12 — Playwright E2E smoke

Prerequisite: phase 11. Re-read `docs/phases/00-MASTER-PLAN.md` (CI rules there are binding: SHA-pinned actions, `permissions: {}` default-deny, concurrency cancel). Clears TECH-DEBT #1 — update that entry to `Resolved by phase 12` and remove Playwright from the "Banked, not shipped" lists (master plan + CONTEXT.md), all in the same commit.

## Goal (the single thing to verify)

One headless-Chromium spec drives the **built, previewed site** end-to-end — DEAL → hold → DRAW → settle → NEW HAND — as a third CI job. It is a smoke test: thin on purpose, one file, browser-only regressions (rendering, base path, CSP violations) go red here and nowhere else.

## Spec

- **Dependency:** `@playwright/test` (dev-only; one line of justification in the PR per the dependency policy). `playwright.config.ts` at the repo root: `testDir: "./e2e"`, projects = chromium **only**, `fullyParallel: false`, `retries: 0` (a flake is a bug — investigate, never paper over). `webServer`: command `npm run build && npm run preview` with env `VITE_BASE_PATH: /poker-react/` and `url: http://localhost:4173/poker-react/` — the spec must therefore navigate relative to the **base path**, catching base-path regressions for free.
- **`e2e/smoke.spec.ts` — one spec, the machine's whole promise:**
  1. The page renders: masthead, CREDITS `100`, DEAL button; no console errors and no CSP violations (fail the test on any `console` message of type `error` AND on `securitypolicyviolation` events via `page.on`).
  2. DEAL → five cards appear, CREDITS drops by exactly the current bet.
  3. Toggle two holds (`aria-pressed` flips), DRAW → the ResultBanner appears with a payout line; CREDITS moved by the banner's payout.
  4. NEW HAND → five empty slots, bet preserved, credits preserved.
  5. Assert the paytable is visible and one row is highlighted only on a payable hand (outcome-independent: read the payout number from the banner and branch — the site uses real `Math.random`, so the spec must pass on EVERY roll).
- **Assertions must be outcome-agnostic** (bet 1, branch on the visible payout text). This is a flow smoke, not a logic test — logic stays unit-tested; do not port Vitest cases here.
- **CI:** extend `ci.yml` with a second job `e2e` (same pinned checkout/setup-node, `npm ci`, `npx playwright install --with-deps chromium`, then `npx playwright test`); cache the Playwright browser download via the built-in cache key of `actions/setup-node` + `--cache-browsers` or `actions/cache` keyed on lockfile + Playwright version. Job gets `permissions: {}`. Keep `ci.yml`'s existing job byte-identical otherwise.
- **Local DX:** add `"test:e2e": "playwright test"` to `package.json` scripts. Add `test-results/`, `playwright-report/`, and Playwright's blob dir to `.gitignore` in the same commit.

## Rules

- Exactly one spec file, one test, chromium, headless. If a second E2E case ever earns its keep, it argues for itself in the PR.
- No new selector hooks in app code — the spec uses roles, labels, and the `data-testid`s already present (`credits`, `empty-slot`). If a query is genuinely impossible, that's a phase-07 a11y bug: fix the markup semantics, not the test hook.
- Vitest and Playwright never share setup: Playwright never runs under Vitest, no jsdom anywhere in `e2e/`.

## Checks (in order, all must pass)

1. `npm run test:e2e` locally green against the preview server (build first — the config's webServer handles it).
2. Break something browser-only on purpose (e.g. mangle `VITE_BASE_PATH` in the config) → spec goes red; undo.
3. PR opens → BOTH `ci.yml` jobs green, including `e2e`. 4. `npm run check && npm test` still green (unit suite untouched).

**Commit message:** `test: ✅ playwright smoke on the previewed build`
**STOP. Phase set complete — no phase 13 unless TECH-DEBT earns one.**
