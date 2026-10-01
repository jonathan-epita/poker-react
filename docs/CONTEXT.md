# CONTEXT — vocabulary

One vocabulary for humans and agents. `_Avoid_` lists are binding: code identifiers, props, CSS classes, and commit messages use the preferred term only. Format inherited from the source project (D9).

| Term            | Definition                                                               | _Avoid_                                         |
| --------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| **Hand**        | The player's 5 cards at any moment                                       | deck-hand, poker hand, cards array              |
| **Deal**        | The act (and action) of putting the first 5 cards on the felt            | deal cards, "start"                             |
| **Draw**        | The single replacement of unheld cards, and the action that triggers it  | swap, refresh, replace, discard-phase           |
| **Hold / held** | A card locked through the Draw; `held[i] === true`                       | keep, lock, select, pick                        |
| **Settle**      | Resolving the hand into rank + payout, entering `settled` phase          | finish, end, resolve                            |
| **Payout**      | Credits added after settle = paytable value × bet                        | win, prize, award                               |
| **Bet**         | Credits staked per Deal, 1–5, ≤ credits                                  | stake, wager                                    |
| **Credits**     | Session balance, starts 100, never persisted                             | coins, balance, money, chips                    |
| **Session**     | One 100-credit life; NEW SESSION resets it                               | game, round, bankroll                           |
| **History**     | Session ledger: the settled Hands of the current Session, in-memory only | stats, log, scoreboard                          |
| **Paytable**    | The single `PAYTABLE` map, rendered as the side panel                    | prize table, payout chart                       |
| **Rank**        | `HandRank` result of evaluate (ROYAL_FLUSH…)                             | hand type, combo, pattern                       |
| **Badge**       | The gold pill naming the current hand                                    | banner (the banner is the settled ResultBanner) |
| **Felt / Rail** | The green play surface / its dark wooden frame                           | table, board, background                        |
| **Machine**     | The whole app pretending to be a video-poker machine                     | simulator, client                               |
| **One-shot**    | Zero persistence by design; reload or NEW SESSION = fresh 100 credits    | free-play, demo mode                            |
| **Cue**         | One synthesized sound at the UI seam: deal, hold, draw, win, bust        | sound, effect, sfx, noise                       |

## Machine rules (domain law, one place)

1. Payout depends **only** on the post-Draw hand; the post-Deal badge is informational. Deviation from casino Jacks-or-Better (where an initial winner auto-pays) — deliberate, see ADR-001.
2. Exactly one Draw per Deal; all-5-held is legal and means "stand".
3. Game over when `settled && credits < 1`; the only exit is NEW SESSION — a pristine 100-credit, bet-1 Session, keeping nothing.

## Banked, not shipped

Multi-hand / tournament modes · streak persistence (violates one-shot) · PWA/i18n. Sound effects shipped in phase 11; Playwright E2E was un-banked as phase 12. Deferred designs live here or in ADRs — never as empty folders or stubs.
