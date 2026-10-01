# Phase 10 — Session history rail

Prerequisite: phase 09. Re-read `docs/phases/00-MASTER-PLAN.md`. Clears TECH-DEBT #3 — update that entry to `Resolved by phase 10` in the same commit.

## Goal (the single thing to verify)

After playing a few hands, a thin **History** rail on the machine reads: hands played, best hand this Session, net credits — and the numbers match your mental arithmetic. Reload or NEW SESSION wipes it: the one-shot promise is untouched, the ledger lives only in reducer memory.

## Spec

- **Reducer (framework-free, stays React-free):** `GameState` gains `history: SettledHand[]`, where `SettledHand = { rank: HandRank; bet: Bet; payout: number }` — one entry appended by the DRAW transition at Settle time. `initialState()` (hence NEW SESSION and reload) starts it empty; NEW HAND carries it over exactly like credits and bet.
- **Derived stats, never stored:** a `sessionStats(state)` selector exported from `src/game/reducer.ts` returning `{ hands, best, net }` — `hands = history.length`, `best` = the lowest `HandRank` enum value seen (the enum is ordered best-first), `net = Σ payout − Σ bet`. Empty history → `{ hands: 0, best: null, net: 0 }`. The UI renders from the selector only.
- **UI:** new presentational `src/components/HistoryRail.tsx` — one line of mono digits + gold labels on the top rail, right of CREDITS: `HANDS 3 · BEST Full House · NET −2`. Hidden entirely while `history` is empty (an idle machine shows no zeros) and while game over (the overlay owns the felt). Same tracking style as the credits readout; it must not wrap or push the BET selector at 360 px — on phones it may sit under CREDITS, still one line.
- **Vocabulary:** add **History** to `docs/CONTEXT.md` (`Session ledger: the settled Hands of the current Session, in-memory only` — _Avoid_: stats, log, scoreboard). Code identifiers use `history`/`SettledHand`/`sessionStats` only.

## Rules

- Zero persistence — no `localStorage`, no module-level cache; the ONLY home of History is reducer state.
- No bet-size analysis, streaks, or anything implying a meta-game; this is a readout, not a feature.
- Machine rules unchanged: the payout rule, phases, and transition table keep their meaning; DRAW gains exactly one appended array entry.

## Tests

- Reducer: DRAW appends one `SettledHand` with the settled rank/bet/payout; NEW_HAND carries history, NEW_SESSION clears it; every illegal transition preserves referential equality including `history`; `sessionStats` on empty/one/mixed histories (best is the enum-minimum, net is signed).
- App (testing-library): after one full Hand at bet 2 with payout 6, the rail reads hands `1`, the settled Rank's label, net `+4`; it survives NEW HAND and disappears on NEW SESSION. Prefer the `getByRole`/text queries already used in `App.test.tsx`.

## Browser check

Play three hands with varied bets, at least one payable: the rail updates after every Draw, BEST names your strongest finished Hand, NET equals credits − 100 exactly. Reload the page: rail gone, machine idle at 100. Phone width: one line, no layout shift on the BET pills.

**Commit message:** `feat: ✨ session history rail`
**STOP. Fresh session for phase 11.**
