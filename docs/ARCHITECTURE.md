# ARCHITECTURE — poker-react

Small by design. Two seams, one state machine, a flat component leaf layer. Adapted from the source project's conceptual architecture (Interface → Application → Domain → Persistence), collapsed to fit the problem: there is no persistence, no orchestration, no external systems.

## Shape

```
┌──────────────────────────────────────────────────────┐
│ Interface   React components (components/, App.tsx)  │  render + dispatch only
│                ↓ dispatch          ↑ derived render  │
│ Application one useReducer         gameReducer       │  the ONLY mutable state
│                ↓ calls pure fns                      │
│ Domain      src/engine/** (cards, evaluate, paytable)│  pure, total, zero deps
└──────────────────────────────────────────────────────┘
Persistence — none, by design (one-shot session; reload = fresh game)
```

## The one rule

`src/engine/**` and `src/game/**` must not import `react`/`react-dom` or touch DOM/window. Enforced by the ESLint `no-restricted-imports` override (created in phase 01, before the folders exist, for exactly this reason). Everything else follows from it: the engine is testable in plain Node, the reducer replays deterministically with a seeded deck.

## State compartments (role-based, per foundation)

| Role                     | Mechanism                                                 | Content                                                    |
| ------------------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
| Authoritative game state | `gameReducer` via `useReducer` in App                     | phase, hand, held, credits, bet, lastPayout                |
| Derived view data        | render-time functions                                     | `evaluate(state.hand)`, `isGameOver(state)` — never stored |
| Ephemeral view state     | component-local CSS/state (none needed beyond animations) | —                                                          |
| Durable state            | **none**                                                  | reload resets — the one-shot promise is a feature          |

## State machine

```
idle ──DEAL(credits≥1, bet≤credits)──▶ dealt ──DRAW──▶ settled ──NEW_HAND──▶ idle
 ▲                                      │ TOGGLE_HOLD↺                        │
 └──────────────── NEW_SESSION (any phase with credits<1 via overlay) ────────┘
```

Reducer invariants: total function, illegal actions return the same object; `hand.length === 5` in dealt/settled; 10-card reserved deck at DEAL makes re-appearance of held cards impossible; all randomness enters via the `deck` payload (UI calls `shuffle(buildDeck(), Math.random)`), so the reducer itself stays pure.

## Domain contracts (see phase files for exact signatures)

- `engine/cards` — Suit/Rank/Card, buildDeck, `shuffle(items, rng)` (rng required → deterministic under test)
- `engine/evaluate` — `evaluate(5 cards) → { rank, label }`; total, returns HIGH_CARD rather than failing (the hand always evaluates)
- `engine/paytable` — `PAYTABLE` map + `payoutFor(rank, bet)`; the ONLY place payouts appear; the panel renders from this map

## Error strategy (deviation from foundation D2, intentional)

No Result type: there is no IO boundary — no fetch, no storage, no user-entered data beyond bounded clicks. A pure total domain throws only on programmer error (impossible action), which is exactly what the type system + exhaustive reducers prevent. See BOOTSTRAP-MAPPING.
