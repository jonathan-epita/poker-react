import { useEffect, useReducer, useRef, useState } from "react";
import { type Sound, type Sounder, createSounder } from "./audio";
import BetSelector from "./components/BetSelector";
import Card from "./components/Card";
import GameOverOverlay from "./components/GameOverOverlay";
import HistoryRail from "./components/HistoryRail";
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
  sessionStats,
} from "./game/reducer";

/**
 * The casino table shell: a dark rail framing the felt, a gold masthead, a
 * credits/History/bet rail, a controls row, a version stamp. The machine state
 * lives here in `useReducer` over the framework-free reducer; components
 * below stay presentational. The optional `rng` is the Deal's injectable
 * randomness — the production default is `Math.random`; tests seed it.
 *
 * The motion layer is presentation-only bookkeeping beside the reducer: an
 * epoch bumped on every Deal re-triggers the deal-in stagger (the cards
 * remount under fresh keys), and the held flags snapshot at Draw time say
 * which replaced cards flip on Settle.
 *
 * Sound is chosen HERE, at the UI seam: the Machine's transition table never
 * knows about it. A `soundOn` flag — off by default, never persisted — gates
 * every cue, so a silent machine never even constructs an AudioContext.
 */

/** The gold speaker toggle beside CREDITS: a round gold ring, no icon library. */
const SOUND_TOGGLE =
  "grid size-9 shrink-0 place-items-center rounded-full text-gold ring-1 ring-gold/30 transition hover:bg-gold/10 aria-pressed:bg-gold/15 aria-pressed:ring-gold/60";

/** Speaker glyph, waves when pressed, a cross when not. Decorative: the
 * button's accessible name is "Sound", its state is `aria-pressed`. */
function SoundGlyph({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M18 7a7 7 0 0 1 0 10" />
        </>
      ) : (
        <path d="M16 9.5l5 5m0-5l-5 5" />
      )}
    </svg>
  );
}

/** The default seam's ONE AudioContext, constructed on the first cue — the
 * click behind that cue is the user gesture the autoplay policy wants. */
let sharedContext: AudioContext | null = null;
function lazyAudioContext(): AudioContext {
  sharedContext ??= new AudioContext();
  return sharedContext;
}
const defaultSounder = createSounder(lazyAudioContext);

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
  /** Cue player; defaults to the lazily-created WebAudio sounder. */
  sounder?: Sounder;
}

export default function App({
  rng = Math.random,
  sounder = defaultSounder,
}: AppProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  // Bumped on every Deal: part of each card's key, so DEAL re-mounts the
  // Hand and the deal-in stagger replays from scratch.
  const [epoch, setEpoch] = useState(0);
  // Snapshot of the unheld positions taken the moment DRAW fires; those
  // cards flip once as the Settle lands. Held slots stay put.
  const [flipped, setFlipped] = useState<boolean[]>([...NO_FLIP]);
  // Sound is off by default and never persisted — a reload returns to
  // silence, the one-shot rule intact. Off means no AudioContext, ever.
  const [soundOn, setSoundOn] = useState(false);
  const play = (cue: Sound) => {
    if (soundOn) sounder(cue);
  };
  const idle = state.phase === "idle";
  const dealt = state.phase === "dealt";
  const settled = state.phase === "settled";
  const gameOver = isGameOver(state);
  // Derivation, not state: the Rank is computed at render, never stored.
  const result = state.hand.length === HAND_SIZE ? evaluate(state.hand) : null;

  // The Settle cue, fired once per dealt→settled transition: a bust thuds,
  // a Payout jingles, silence pays nothing. The ref guard means a re-render
  // never re-fires the cue.
  const phaseRef = useRef(state.phase);
  useEffect(() => {
    const settling = phaseRef.current === "dealt" && state.phase === "settled";
    phaseRef.current = state.phase;
    if (!settling || !soundOn) return;
    if (isGameOver(state)) sounder("bust");
    else if (state.lastPayout > 0) sounder("win");
  }, [state, soundOn, sounder]);

  const primaryAction = () => {
    if (idle) {
      setEpoch((bumped) => bumped + 1);
      setFlipped([...NO_FLIP]);
      play("deal");
      dispatch({ type: "DEAL", deck: dealDeck(rng) });
    } else if (dealt) {
      setFlipped(state.held.map((held) => !held));
      play("draw");
      dispatch({ type: "DRAW" });
    } else {
      dispatch({ type: "NEW_HAND" });
    }
  };

  return (
    <div className="flex h-dvh flex-col gap-4 overflow-hidden bg-rail p-4 text-cream sm:gap-5 sm:p-8">
      {/* Top rail: masthead over a gold divider, then CREDITS and the
          History readout left, the BET selector right. The History group
          shares a wrap-container with CREDITS so phones drop it below
          rather than squeezing the BET pills. */}
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* The mute toggle steps back with the rail on game over — the
                overlay owns the machine then. aria-pressed appears only when
                pressed: an absent attribute already reads as unpressed, and
                the silent machine's tree stays exactly as it was before the
                seam existed. */}
            {!gameOver && (
              <button
                type="button"
                aria-label="Sound"
                aria-pressed={soundOn || undefined}
                onClick={() => setSoundOn((on) => !on)}
                className={SOUND_TOGGLE}
              >
                <SoundGlyph on={soundOn} />
              </button>
            )}
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
            {!gameOver && <HistoryRail {...sessionStats(state)} />}
          </div>
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
                        onToggle={() => {
                          play("hold");
                          dispatch({
                            type: "TOGGLE_HOLD",
                            index: position as HoldIndex,
                          });
                        }}
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
