# Phase 09 — Docs finalization + bootstrap report

Prerequisite: phase 08 (site is live). Re-read `docs/phases/00-MASTER-PLAN.md`.

## Goal (the single thing to verify)

A newcomer with Node 22 can clone, run, test, and deploy from the README alone, and the repo documents what was actually built and what was deliberately not. Final gate: `npm run check && npm test` + the Validation checklist below all ticked.

## Steps

1. **README.md** — one-line description, live URL, screenshots optional; Quick start (`npm ci`, `npm run dev`); Scripts table; Deploy (push to main → Pages; VITE_BASE_PATH knob); ONE toolchain truth (`engines` in package.json, referenced not repeated); links to docs/.
2. **CONTRIBUTING.md** — Conventional Commits + emoji markers, `npm run check && npm test` gate, pre-commit hooks, dependency-justification rule, vocabulary must match `docs/CONTEXT.md`. `.github/pull_request_template.md`: checkboxes (check green, tests green, new deps justified with a line, vocabulary checked).
3. **`docs/BOOTSTRAP-REPORT.md`** — the skill's report shape, written from reality (inspect git log + code, don't copy the plan): Foundation Used (corpusense `foundation/` @ repo), Target Stack, Architecture, **Preserved Principles** (static SPA shape, CI hygiene incl. PR gate correction, strict-typed core + mechanical layering rule, glossary, Conventional Commits, one deployment knob, deterministic formatting, toolchain single truth), **Adapted Patterns** (state compartments → one reducer; repository/DB spine → NONE, see below; test-mode seams → injectable rng), **Source Elements Not Applied** (with reasons): D1 local-DB spine, D2 Result types (no IO boundary — engine is pure & total), D3 sagas, D4 factory seam (nothing to substitute), D5 plugin registry, P7 status-law, i18n, PWA, P12 chunk-splitting; **New Architectural Decisions** (arcade payout rule ADR, injectable rng, engine-free-of-react lint rule); Testing strategy; Security (CSP, no secrets by construction); Observability (dev console only — no seam needed, one-line rationale); **Initial tech debt** (see below); Known limitations; Next steps.
4. **`docs/TECH-DEBT.md`** — Problem/Impact/Reason/Potential-solution/Priority for at least: no E2E (Playwright banked), sound banked, no bet-history UI, animations CSS-only (list trade-off if felt).
5. **ADR review** (`docs/decisions/`): ensure the arcade payout rule and the CSP-widening are documented as ADRs; add any that phases should have written but didn't.
6. **CONTEXT.md**: sweep for drift — every term actually used in code/components, `_Avoid_` lists complete.
7. Update phase files that turned out wrong (e.g. phase 03's GamePhase note) — the plan stays honest for a future re-run.

## Validation checklist (from the skill, scaled to this project)

- [ ] architecture: seams exist, lint-enforced; responsibilities match ARCHITECTURE.md
- [ ] code: conventions in CONTRIBUTING, deps justified, error strategy documented (pure-total engine → throw only on programmer error)
- [ ] tests: engine full-branch (all 10 ranks + wheel), reducer machine (all legal+illegal transitions), flow component test
- [ ] tooling: check/test/build green locally and in CI
- [ ] CI/CD: PR gate blocks merge (enable branch protection on main — do it via gh/CLI), deploy works, audit step present
- [ ] docs: README/CONTRIBUTING/CONTEXT/ARCHITECTURE/BOOTSTRAP-REPORT/TECH-DEBT complete
- [ ] security: CSP live on Pages URL (verify via curl `<meta>` + DevTools), no secrets surface
- [ ] dead code: none — grep for exports with zero importers

**Commit message:** `docs: 📝 finalize README, contributing, bootstrap report`
**This is the last phase.** Report completion; do not start "phase 10".
