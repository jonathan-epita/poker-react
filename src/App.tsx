import { useReducer } from "react";
import Card from "./components/Card";
import { HAND_SIZE, gameReducer, initialState } from "./game/reducer";

/**
 * The casino table shell: a dark rail framing the felt, a gold masthead, a
 * controls row, a version stamp. The machine state lives here in `useReducer`
 * over the framework-free reducer; components below stay presentational.
 */

/**
 * Empty felt slot: same footprint as a size-md Card so the layout never
 * jumps between idle and dealt. Felt-dark with a faint ring.
 */
const SLOT_FRAME =
  "aspect-[2/3] w-24 rounded-lg bg-felt-deep/40 shadow-[inset_0_2px_10px_rgb(0_0_0/0.35)] ring-1 ring-cream/10";

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  const idle = state.phase === "idle";

  return (
    <div className="flex h-dvh flex-col gap-5 overflow-hidden bg-rail p-4 text-cream sm:p-8">
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
      </header>

      {/* Rail: a bevelled frame that the felt sits inside. */}
      <div className="min-h-0 flex-1 rounded-[2.5rem] bg-rail p-2 shadow-[inset_0_1px_0_rgb(250_246_238/0.07),0_18px_50px_-12px_rgb(0_0_0/0.8)] ring-1 ring-gold/20 sm:p-3">
        <div className="h-full w-full rounded-[2rem] bg-[radial-gradient(ellipse_at_center,var(--color-felt)_35%,var(--color-felt-deep)_100%)] shadow-[inset_0_0_120px_rgb(0_0_0/0.55),inset_0_0_0_1px_rgb(217_164_65/0.12)]">
          {/* Hand area: the dealt Hand, or five empty slots while idle. */}
          <div className="flex h-full w-full flex-wrap items-center justify-center gap-3 px-4 sm:gap-6">
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
                  <Card key={position} card={card} />
                ))}
          </div>
        </div>
      </div>

      {/* Controls row: the machine's single primary action. */}
      <div className="flex shrink-0 justify-center">
        <button
          type="button"
          onClick={() =>
            dispatch(idle ? { type: "DEAL" } : { type: "NEW_HAND" })
          }
          className="rounded-full bg-gold px-10 py-3 font-serif text-lg font-bold tracking-[0.25em] text-rail uppercase shadow-[0_6px_20px_-6px_rgb(217_164_65/0.6),inset_0_1px_0_rgb(255_255_255/0.35)] ring-1 ring-gold/60 transition-[filter,transform] hover:brightness-110 active:translate-y-px"
        >
          {idle ? "DEAL" : "NEW HAND"}
        </button>
      </div>

      <footer className="shrink-0 text-center text-xs tracking-[0.25em] text-cream/40">
        v{__APP_VERSION__}
      </footer>
    </div>
  );
}
