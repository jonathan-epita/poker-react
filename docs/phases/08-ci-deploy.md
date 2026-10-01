# Phase 08 — CI + GitHub Pages deploy

Prerequisite: phase 07. Re-read `docs/phases/00-MASTER-PLAN.md` (CI rules there are binding: default-deny, SHA-pinned, concurrency cancel, build→deploy split).

## Goal (the single thing to verify)

The game is **live at its GitHub Pages URL** with a green `ci.yml` on the PR. Everything below is plumbing toward that one check.

## Steps

1. **Repo**: `git remote add origin git@github.com:<user>/poker-react.git` (ask the user for the GitHub username / create the empty repo first — never guess). Push `main`.
2. **`VITE_BASE_PATH`** (already the one knob): in `vite.config.ts` `base: process.env.VITE_BASE_PATH ?? "/"`. For project pages the deploy workflow sets `VITE_BASE_PATH: /poker-react/` (trailing slash). No other base-path logic anywhere.
3. **`ci.yml`** — triggers: pull_request + push to main, one job:
   - `permissions: {}` (this job needs nothing); concurrency `group ci-${{ github.ref }}, cancel-in-progress: true`; runner `ubuntu-24.04`; `actions/checkout` and `actions/setup-node` **pinned to full commit SHAs with version comment** (look them up at implementation time via `git ls-remote` / the GitHub UI commit view — do not use tags as refs); `npm ci` with cache; then `npm run check`, `npm test`, `npm run build`, `npm audit --omit=dev`.
   - Audit may fail on a transitive dev-only advisory: fix properly (upgrade the parent) — never `--audit-level`-weaken it; if a prod-scope advisory is unavoidable, add an ADR in `docs/decisions/` and `--audit-level=critical` for prod with in-file rationale.
4. **`deploy.yml`** — push to main + `workflow_dispatch`; `permissions: {}` top-level; job `build`: same pinned steps + build with base env + `actions/upload-pages-artifact`; job `deploy`: `needs: build`, `permissions: { pages: write, id-token: write }`, `actions/deploy-pages`, `environment: { name: github-pages, url: … }`; concurrency `group pages, cancel-in-progress: true`.
5. **CSP**: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">` in `index.html` (Tailwind injects inline styles — that's the only widening). No external origins exist; keep it that way.
6. Add CI badge to README header (one line, no README work otherwise — phase 09 owns it).

## Checks (in order, all must pass)

1. PR opens, `ci.yml` green. 2. Merge → deploy run green → **open the Pages URL in a browser: deal a full winning hand on the LIVE site.** 3. Edit a comment, push, confirm Pages redeploys (concurrency didn't wedge). 4. `npm run build` locally with `VITE_BASE_PATH=/poker-react/` and `npx serve dist` under a sub-path — assets resolve (catches base-path bugs before GitHub does).

**Commit message:** `ci: ♻️ PR gate and GitHub Pages deploy` (chore/ci prefix with emoji per conventions)
**STOP. Fresh session for phase 09.**
