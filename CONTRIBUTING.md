# Contributing

## Ground rules

1. **The gate:** `npm run check && npm test` green before anything is pushed. `ci.yml` runs the same commands (plus build and audit) and branch protection blocks merge on red.
2. **Vocabulary:** `docs/CONTEXT.md` is law. Code identifiers, props, CSS classes and commit messages use the preferred terms only — `_Avoid_` lists are binding.
3. **The layering rule:** `src/engine/**` and `src/game/**` never import `react`/`react-dom` or touch DOM/window. ESLint enforces this mechanically; UI imports game/engine, never the reverse.
4. **Dependencies:** the stack table in `docs/phases/00-MASTER-PLAN.md` is the allowlist. Anything new needs a one-line justification in the PR description. Dependencies are re-derived from needs, never copied from other projects.
5. **No placeholders:** no empty directories, no commented-out code, no stubs for future phases. Deferred designs go to `docs/decisions/` (ADRs) or `docs/TECH-DEBT.md`.

## Commits

Conventional Commits with the project's emoji markers:

| Type  | Marker | Example                                      |
| ----- | ------ | -------------------------------------------- |
| feat  | ✨     | `feat: ✨ credit economy with betting`       |
| fix   | 🐛     | `fix: 🐛 paytable row highlight on Two Pair` |
| docs  | 📝     | `docs: 📝 finalize README`                   |
| test  | ✅     | `test: ✅ wheel straight coverage`           |
| chore | ✂️     | `chore: ✂️ drop unused export`               |
| ci    | ♻️     | `ci: ♻️ PR gate and Pages deploy`            |

## Hooks

husky runs lint-staged on every commit: staged code is Prettier-formatted and ESLint-checked (`--max-warnings 0`), other files are Prettier-formatted. The full `check` + `test` gate still runs in CI — hooks are the fast layer, CI is the truth.

## Tests

- The engine is tested as pure functions; randomness enters only through an injectable `rng` (`shuffle(items, rng)`, seeded via `src/engine/testing.ts` in tests). Never mock time randomly.
- The reducer is tested as a total function: every legal transition, and every illegal one asserted by referential equality.
- Component tests use testing-library + user-event at the flow level (`src/App.test.tsx`).

## Style

TypeScript `strict` plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, type-aware ESLint with `no-explicit-any`, `strict-boolean-expressions` and `no-shadow` as errors. Prettier is deterministic: imports and class attributes are organized, Tailwind classes sorted — don't hand-order, run `npm run format`. Disabled lint rules need an in-file rationale comment.
