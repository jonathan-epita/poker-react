import { useReducer } from "react";
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
 */

/** Empty felt slot: same footprint as a size-md Card so the layout never
 * jumps between idle and dealt. Felt-dark with a faint ring. */
const SLOT_FRAME =
  "aspect-[2/3] w-24 rounded-lg bg-felt-deep/40 shadow-[inset_0_2px_10px_rgb(0_0_0/0.35)] ring-1 ring-cream/10";

interface AppProps {
  /** Shuffle source for `dealDeck`; deterministic in tests. */
  rng?: () => number;
}

export default function App({ rng = Math.random }: AppProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  const idle = state.phase === "idle";
  const dealt = state.phase === "dealt";
  const settled = state.phase === "settled";
  const gameOver = isGameOver(state);
  // Derivation, not state: the Rank is computed at render, never stored.
  const result = state.hand.length === HAND_SIZE ? evaluate(state.hand) : null;

  const primaryAction = () =>
    dispatch(
      idle
        ? { type: "DEAL", deck: dealDeck(rng) }
        : dealt
          ? { type: "DRAW" }
          : { type: "NEW_HAND" },
    );

  return (
    <div className="flex h-dvh flex-col gap-5 overflow-hidden bg-rail p-4 text-cream sm:p-8">
      {/* Top rail: masthead, then CREDITS left and the BET selector right. */}
      <header className="shrink-0 text-center">
        <h1 className="font-serif text-2xl font-bold tracking-[0.3em] text-gold uppercase sm:text-4xl">
          Video Poker
          <span aria-hidden="true" className="mx-3 text-gold/50">
            ·
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] sm:text-xl">
            Jacks or Better
          </span>
        </h1>
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

      {/* Rail: a bevelled frame that the felt sits inside. */}
      <div className="min-h-0 flex-1 rounded-[2.5rem] bg-rail p-2 shadow-[inset_0_1px_0_rgb(250_246_238/0.07),0_18px_50px_-12px_rgb(0_0_0/0.8)] ring-1 ring-gold/20 sm:p-3">
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_center,var(--color-felt)_35%,var(--color-felt-deep)_100%)] p-4 shadow-[inset_0_0_120px_rgb(0_0_0/0.55),inset_0_0_0_1px_rgb(217_164_65/0.12)] lg:flex-row lg:gap-10 lg:p-8">
          {/* Hand column: Banner (settled) or Badge (dealt) over the Hand,
              or five empty slots while idle. Hidden entirely on game over —
              the overlay owns the felt then. */}
          {!gameOver && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 pt-2 sm:gap-6">
              {settled && result !== null && (
                <ResultBanner label={result.label} payout={state.lastPayout} />
              )}
              {dealt && result !== null && <ResultBadge label={result.label} />}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
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
                        key={position}
                        card={card}
                        held={state.held[position]}
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
