# Phase 01 — Scaffold + toolchain

Prerequisite: none. The repo contains only `docs/` (this plan). Working dir: `poker-react/` (repo root).

## Goal (the single thing to verify)

`npm run dev` shows a **casino-table shell**: dark green felt area with a rounded dark rail, a gold header "VIDEO POKER · Jacks or Better", and a footer with a version stamp. Nothing else. No cards, no buttons, no state.

## Steps

1. `git init` (branch `main`), then all commands from repo root.
2. Scaffold Vite manually or via `npm create vite@latest . -- --template react-ts` (React 19, Vite 7). Keep the tree lean:
   ```
   src/
   ├── App.tsx          # the shell only
   ├── main.tsx
   ├── index.css        # @import "tailwindcss"; @theme { … } design tokens
   └── vite-env.d.ts
   index.html
   vite.config.ts       # ONE config for build + test; base: process.env.VITE_BASE_PATH ?? "/"
   tsconfig*.json       # strict + noUnusedLocals + noUnusedParameters + noFallthroughCasesInSwitch
   package.json         # engines: { node: "22", npm: "11.6.4" }  ← single toolchain truth
   ```
3. Tailwind 4: `tailwindcss` + `@tailwindcss/vite` plugin in `vite.config.ts`; in `index.css` define the theme tokens:
   ```css
   @theme {
     --color-felt: #0c5c3f;
     --color-felt-deep: #094a32;
     --color-rail: #1a1410;
     --color-gold: #d9a441;
     --color-cream: #faf6ee;
   }
   ```
4. ESLint 9 flat config: `typescript-eslint` `eslint.config(...{ extends: tseslint.configs.recommendedTypeChecked })` + react-hooks + react-refresh; `@typescript-eslint/no-explicit-any: error`, `strict-boolean-expressions: error`, `no-shadow: error`. Add the architecture override NOW (it protects phases 2+):
   ```js
   { files: ["src/engine/**/*.ts", "src/game/**/*.ts"],
     rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["react", "react-dom", "react/*"], message: "engine/game layers are framework-free" }] }] } }
   ```
5. Prettier with plugins `prettier-plugin-organize-imports`, `@trivago/prettier-plugin-class-attributes`, `prettier-plugin-tailwindcss`.
6. Vitest: `test: { environment: "jsdom", setupFiles: "vitest.setup.ts", restoreMocks: true }` inside `vite.config.ts`; setup file imports `@testing-library/jest-dom`. One smoke test: App renders the header text.
7. husky + lint-staged: pre-commit runs `prettier --write` + `eslint --max-warnings 0` on staged files; `lint-staged` config in package.json.
8. Scripts: `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `typecheck` (`tsc -b --noEmit` or `--emitDeclarationOnly` into `node_modules/.tmp`), `test`, `check` (= lint + format:check + typecheck), `prepare` (husky).
9. `.gitignore`: `node_modules`, `dist`, `coverage`, `.env*.local`, `node_modules/.tmp`.
10. Commit docs/ and the scaffold together.

## Browser check

`npm run dev` → felt background fills the viewport, header in gold serif-ish bold caps, footer small grey. No layout shift, no console errors. `npm run check && npm test` green.

## Done criteria

- Toolchain works end-to-end (a deliberately mis-formatted or `any`-typed file fails `npm run check`).
- No empty `engine/`/`game/`/`components/` folders created yet — they arrive in the phase that fills them.

**Commit message:** `feat: ✨ scaffold Vite + React + Tailwind + toolchain`
**STOP. Open a fresh session for phase 02.**
