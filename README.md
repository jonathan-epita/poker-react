# Video Poker · Jacks or Better

[![CI](https://github.com/jonathan-epita/poker-react/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathan-epita/poker-react/actions/workflows/ci.yml)

A one-shot Jacks-or-Better video-poker arcade machine: 100 credits, bet 1–5, one Draw per hand — and zero persistence by design.

**Live:** https://jonathan-epita.github.io/poker-react/

## How it plays

Deal 5 cards → toggle **HOLD**s → **DRAW** once → the hand settles against the paytable. The payout depends only on the post-Draw hand (holding all 5 is the legal way to stand); see `docs/CONTEXT.md` for the full machine rules and `docs/decisions/ADR-001` for why. Game over below one credit; NEW SESSION restores 100.

## Quick start

```bash
npm ci
npm run dev
```

Requires the Node and npm versions declared in `package.json` `engines` — the ONE toolchain truth of this repo; CI reads the same file (`node-version-file`) and this README deliberately does not repeat it.

## Scripts

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Vite dev server                                       |
| `npm run build`        | Type-checks, then builds the static site into `dist/` |
| `npm run preview`      | Serves the built `dist/` locally                      |
| `npm test`             | Vitest, once                                          |
| `npm run test:watch`   | Vitest, watch mode                                    |
| `npm run lint`         | ESLint (flat config, type-aware)                      |
| `npm run format`       | Prettier, write                                       |
| `npm run format:check` | Prettier, check                                       |
| `npm run typecheck`    | `tsc -b --noEmit`                                     |
| `npm run check`        | lint + format:check + typecheck (the pre-merge gate)  |

Before pushing, `npm run check && npm test` must be green; husky + lint-staged format and lint every staged file at commit time. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Deploy

Push to `main` → `deploy.yml` builds and publishes to GitHub Pages. `VITE_BASE_PATH` in `vite.config.ts` is the ONE deployment knob (the workflow sets `/poker-react/` for project Pages). `ci.yml` runs on every PR and push and blocks merge via branch protection on `main`.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the two-seam shape and the one layering rule
- [`docs/CONTEXT.md`](docs/CONTEXT.md) — the project vocabulary (`_Avoid_` lists are binding)
- [`docs/BOOTSTRAP-REPORT.md`](docs/BOOTSTRAP-REPORT.md) — what was built from the foundation, what was deliberately not
- [`docs/TECH-DEBT.md`](docs/TECH-DEBT.md) — known debt, prioritized
- [`docs/decisions/`](docs/decisions/) — ADRs
- [`docs/phases/`](docs/phases/) — the phase plan this project was executed against
