# ADR-001 — Arcade payout rule: final hand only

## Context

Casino Jacks-or-Better machines evaluate the initial 5-card deal: if it already contains a payable hand, the machine auto-pays and the hand ends without a Draw. The source spec of this project is a relaxed single-hand arcade game.

## Decision

Payout is determined **solely by the post-Draw hand**. After the Deal, an evaluation badge is shown but is informational only ("draw to try for a payout"). Holding all 5 and pressing DRAW is the legal way to stand on an initial winner. Encoded in `docs/CONTEXT.md` (Machine rules §1); enforced by the reducer flow only — there is no branch anywhere that pays on `dealt`.

## Alternatives

1. **Casino rule** — authentic, but needs an auto-transition (dealt→settled) that complicates the machine, hides the Draw from new players, and made the first phases untestable-as-one-flow.
2. **Pay-on-both (dealt OR final)** — paytable would need two payout paths; players learn to never draw; degenerates the core interaction.

## Consequences

- State machine stays a 3-phase line, every hand has the same shape — simpler reducer, simpler tests, gentler onboarding.
- A royal on the deal is NOT a free 250×bet; the player must risk holding it. Accepted: it's honest arcade design and prevents "auto-win then wonder what happened".
- Deviation from the real game is documented here and in CONTEXT.md so it reads as a decision, never an accident (foundation practice).
