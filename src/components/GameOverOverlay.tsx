import { GOLD_BUTTON } from "./button";

/**
 * The game-over overlay: shown full-felt when a settled Hand has left the
 * Session below one credit. It replaces everything on the felt — NEW SESSION
 * is the only control the machine still offers — and reports the final
 * balance under the headline.
 */

interface GameOverOverlayProps {
  /** The busted Session's closing balance. */
  credits: number;
  onNewSession: () => void;
}

export default function GameOverOverlay({
  credits,
  onNewSession,
}: GameOverOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-10 grid place-items-center rounded-[2rem] bg-rail/85 backdrop-blur-[3px]"
      data-testid="game-over-overlay"
    >
      <div className="flex flex-col items-center gap-5">
        <p className="font-serif text-4xl font-bold tracking-[0.35em] text-gold uppercase shadow-[0_0_30px_rgb(217_164_65/0.35)] sm:text-5xl">
          GAME OVER
        </p>
        <p className="text-sm tracking-[0.25em] text-cream/60 uppercase">
          Final credits{" "}
          <span className="font-mono text-lg font-bold text-gold tabular-nums">
            {credits}
          </span>
        </p>
        <button className={GOLD_BUTTON} onClick={onNewSession} type="button">
          NEW SESSION
        </button>
      </div>
    </div>
  );
}
