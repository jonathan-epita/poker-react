# ADR-002 — CSP: `'self'` everywhere, one inline-style widening

## Context

GitHub Pages serves the built site with fixed infrastructure headers — there is no way to attach a CSP response header, so the policy ships as a `<meta http-equiv>` tag in `index.html` (written in phase 08). The constraint from the security rules: default-deny, no external origins exist in this app. The friction: Tailwind 4 via Vite injects inline `<style>` tags in development, and production CSS imports resolve through Vite's stylesheet pipeline — a blanket `style-src 'self'` breaks the dev server's styling loop.

## Decision

`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` — inline **styles** are the single widening. Scripts, connections, workers, forms, frames: `'self'`, no exceptions, no nonces (there is no server to mint them and the app injects no runtime scripts).

## Alternatives

1. **No inline styles anywhere** — strictly stronger, but breaks `npm run dev` styling with Tailwind's dev-time injection; the phase would have shipped a broken dev loop or a build-config hack to hide the injection.
2. **Hash-based style allowlist** — Vite's hashed inline blocks differ between dev and build; maintaining a hash policy against a bundler's output is a footgun with no payoff at this size.
3. **CSP report-only** — observability without enforcement, on a host with nowhere to report to. Rejected.

## Consequences

- XSS via script injection gets nothing: scripts and `connect-src` (via `default-src`) are `'self'`, and `'self'` for scripts means only the two build-time hashed bundles — inline script is refused even with `'unsafe-inline'` absent from `script-src`. Verified live: the Pages HTML carries the meta and DevTools reports no violations.
- Inline-style injection is permitted — mitigated by the fact that all rendered text passes through React's escaping and no user input exists beyond bounded clicks.
- Known limits of meta-CSP (`frame-ancestors` unavailable) are recorded in `docs/TECH-DEBT.md` §5.
- Any future widening must amend this ADR before touching `index.html`.
