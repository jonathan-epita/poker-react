# Phase 02 — Card engine + styled card rendering

Prerequisite: phase 01 (scaffold committed). Re-read `docs/phases/00-MASTER-PLAN.md`.

## Goal (the single thing to verify)

Five **fully styled playing cards** rendered on the felt — a hard-coded hand (e.g. Royal Flush in ♠), rank/suit in corners, big center pip, red suits in red, black in near-black, cream face, rounded, soft shadow, correct aspect ratio. No game logic visible to the user beyond these cards.

## Engine spec (`src/engine/cards.ts` — pure, zero imports from react/DOM)

```ts
type Suit = "S" | "H" | "D" | "C";                 // Spades Hearts Diamonds Clubs
type Rank = 2|3|4|5|6|7|8|9|10|11|12|13|14;        // 11=J 12=Q 13=K 14=A
interface Card { rank: Rank; suit: Suit }
const SUIT_GLYPH: Record<Suit, string>              // ♠ ♥ ♦ ♣
const RANK_LABEL: Record<Rank, "A"|"K"|…"2">
function buildDeck(): Card[]                        // 52, ordered
function shuffle<T>(items: T[], rng: () => number): T[]   // Fisher–Yates, INJECTABLE rng
function isRed(suit: Suit): boolean
```

`shuffle` takes `rng` as a REQUIRED parameter — callers pass `Math.random`; tests pass a seeded LCG helper (`src/engine/testing.ts`, exported, used only by tests). This keeps the engine deterministic-under-test without mocking.

## Card component (`src/components/Card.tsx`)

- Props: `card: Card`, optional `size`. Pure presentational; suit colors via `text-rose-600` / `text-zinc-900`.
- Layout: `aspect-[2/3] rounded-lg bg-cream shadow-md`, top-left rank+glyph, mirrored bottom-right (rotated 180°), large centered glyph.
- Render the hard-coded hand in `App.tsx` in a flex row (the future Hand area) — inline in App is fine; no new abstraction folders beyond `components/`.

## Tests

`src/engine/cards.test.ts`: deck is 52 unique well-formed cards; `shuffle` with seeded rng is a permutation (same 52 unique) and differs from order; `isRed` mapping. Component test: `<Card card={…AceSpades}>` shows "A" and "♠"; heart card gets red class.

## Browser check

Page shows the shell (phase 01) + exactly 5 cards in a row on the felt, properly sized on a phone-width viewport (wrap if needed). Cards look like CARDS.

## Done criteria

- `npm run check && npm test` green; ESLint architecture rule actually rejects a test-file `import react` into engine (verify once, then remove).

**Commit message:** `feat: ✨ card engine and styled card component`
**STOP. Fresh session for phase 03.**
