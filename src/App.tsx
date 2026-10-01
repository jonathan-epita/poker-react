import { useReducer, useState } from "react";
import BetSelector from "./components/BetSelector";
import Card from "./components/Card";
import GameOverOverlay from "./components/GameOverOverlay";
import Paytable from "./components/Paytable";
import ResultBadge from "./components/ResultBadge";
import ResultBanner from "./components/ResultBanner";
import { GOLD_BUTTON } from "./components/button";
import { evaluate } from "./engine/evaluate";
import {
  type Bet,
  type HoldIndex,
  dealDeck,
  gameReducer,
  HAND_SIZE,
  initialState,
  isGameOver,
} from "./game/reducer";

/**
 * The casino table shell: a dark rail framing the felt, a gold masthead, a
 * credits-and-bet rail, a controls row, a version stamp. The machine state
 * lives here in `useReducer` over the framework-free reducer; components
 * below stay presentational. The optional `rng` is the Deal's injectable
 * randomness — the production default is `Math.random`; tests seed it.
 *
 * The motion layer is presentation-only bookkeeping beside the reducer: an
 * epoch bumped on every Deal re-triggers the deal-in stagger (the cards
 * remount under fresh keys), and the held flags snapshot at Draw time say
 * which replaced cards flip on Settle.
 */

/** Empty felt slot: same footprint as a size-md Card so the layout never
 * jumps between idle and dealt. Felt-dark with a faint ring. */
const SLOT_FRAME =
  "aspect-[2/3] w-24 max-w-full rounded-lg bg-felt-deep/40 shadow-[inset_0_2px_10px_rgb(0_0_0/0.35)] ring-1 ring-cream/10 max-md:w-full";

/** The five-card row: one flat grid (never wraps the Hand) and a container,
 * so card pips scale with the cards themselves, not the viewport. */
const HAND_ROW =
  "@container grid w-full max-w-xl grid-cols-5 place-items-center gap-1.5 sm:max-w-2xl sm:gap-6";

/** No card is mid-Draw: the flip mask between Draws is all-false. */
const NO_FLIP: readonly boolean[] = Array.from(
  { length: HAND_SIZE },
  () => false,
);

interface AppProps {
  /** Shuffle source for `dealDeck`; deterministic in tests. */
  rng?: () => number;
}

export default function App({ rng = Math.random }: AppProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  // Bumped on every Deal: part of each card's key, so DEAL re-mounts the
  // Hand and the deal-in stagger replays from scratch.
  const [epoch, setEpoch] = useState(0);
  // Snapshot of the unheld positions taken the moment DRAW fires; those
  // cards flip once as the Settle lands. Held slots stay put.
  const [flipped, setFlipped] = useState<boolean[]>([...NO_FLIP]);
  const idle = state.phase === "idle";
  const dealt = state.phase === "dealt";
  const settled = state.phase === "settled";
  const gameOver = isGameOver(state);
  // Derivation, not state: the Rank is computed at render, never stored.
  const result = state.hand.length === HAND_SIZE ? evaluate(state.hand) : null;

  const primaryAction = () => {
    if (idle) {
      setEpoch((bumped) => bumped + 1);
      setFlipped([...NO_FLIP]);
      dispatch({ type: "DEAL", deck: dealDeck(rng) });
    } else if (dealt) {
      setFlipped(state.held.map((held) => !held));
      dispatch({ type: "DRAW" });
    } else {
      dispatch({ type: "NEW_HAND" });
    }
  };

  return (
    <div className="flex h-dvh flex-col gap-4 overflow-hidden bg-rail p-4 text-cream sm:gap-5 sm:p-8">
      {/* Top rail: masthead over a gold divider, then CREDITS left and the
          BET selector right. */}
      <header className="shrink-0 text-center">
        <h1 className="font-serif text-xl font-bold tracking-[0.2em] text-gold uppercase sm:text-4xl sm:tracking-[0.3em]">
          Video Poker
          <span aria-hidden="true" className="mx-2 text-gold/50 sm:mx-3">
            ·
          </span>
          <span className="text-xs font-semibold tracking-[0.2em] sm:text-xl">
            Jacks or Better
          </span>
        </h1>
        <div
          aria-hidden="true"
          className="mx-auto mt-2 h-px w-full bg-linear-to-r from-transparent via-gold/50 to-transparent"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-[0.7rem] font-bold tracking-[0.35em] text-gold uppercase">
              Credits
            </span>
            <span
              className="font-mono text-2xl font-bold text-gold tabular-nums"
              data-testid="credits"
            >
              {state.credits}
            </span>
          </p>
          {!gameOver && (
            <BetSelector
              bet={state.bet}
              credits={state.credits}
              enabled={idle}
              onSelect={(bet: Bet) => dispatch({ type: "SET_BET", bet })}
            />
          )}
        </div>
      </header>

      {/* Rail: a bevelled frame with a soft inner shadow ring, felt inside. */}
      <div className="min-h-0 flex-1 rounded-[2.5rem] bg-rail p-2 shadow-[inset_0_1px_0_rgb(250_246_238/0.07),inset_0_0_34px_rgb(0_0_0/0.45),0_18px_50px_-12px_rgb(0_0_0/0.8)] ring-1 ring-gold/20 sm:p-3">
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_center,var(--color-felt)_35%,var(--color-felt-deep)_100%)] p-4 shadow-[inset_0_0_120px_rgb(0_0_0/0.55),inset_0_0_0_1px_rgb(217_164_65/0.12)] md:flex-row md:gap-10 md:p-8">
          {/* Hand column: Banner (settled) or Badge (dealt) over the Hand,
              or five empty slots while idle. Hidden entirely on game over —
              the overlay owns the felt then. */}
          {!gameOver && (
            <div className="flex min-h-0 flex-col items-center justify-center gap-3 max-md:self-stretch md:flex-1 md:gap-6">
              {settled && result !== null && (
                <ResultBanner label={result.label} payout={state.lastPayout} />
              )}
              {dealt && result !== null && <ResultBadge label={result.label} />}
              <div className={HAND_ROW}>
                {idle
                  ? Array.from({ length: HAND_SIZE }, (_, position) => (
                      <div
                        aria-hidden="true"
                        data-testid="empty-slot"
                        key={position}
                        className={SLOT_FRAME}
                      />
                    ))
                  : state.hand.map((card, position) => (
                      <Card
                        key={`${epoch}:${position}`}
                        card={card}
                        held={state.held[position]}
                        dealIndex={position}
                        flip={flipped[position]}
                        onToggle={() =>
                          dispatch({
                            type: "TOGGLE_HOLD",
                            index: position as HoldIndex,
                          })
                        }
                        disabled={!dealt}
                      />
                    ))}
              </div>
            </div>
          )}

          {/* Paytable: right of the Hand on desktop, below it on mobile. */}
          <Paytable
            bet={state.bet}
            rank={result !== null && !gameOver ? result.rank : null}
            won={settled && state.lastPayout > 0}
          />

          {gameOver && (
            <GameOverOverlay
              credits={state.credits}
              onNewSession={() => dispatch({ type: "NEW_SESSION" })}
            />
          )}
        </div>
      </div>

      {/* Controls row: the machine's single primary action, by phase. A
          busted Session answers only to NEW SESSION, on the overlay. */}
      {!gameOver && (
        <div className="flex shrink-0 justify-center">
          <button className={GOLD_BUTTON} onClick={primaryAction} type="button">
            {idle ? "DEAL" : dealt ? "DRAW" : "NEW HAND"}
          </button>
        </div>
      )}

      <footer className="shrink-0 text-center text-xs tracking-[0.25em] text-cream/40">
        v{__APP_VERSION__}
      </footer>
    </div>
  );
}
