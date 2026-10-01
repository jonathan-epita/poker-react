import { type Bet, BET_VALUES } from "../game/reducer";

/**
 * The BET selector: five gold-outlined pills on the rail, 1 through 5. The
 * active stake is gold-filled; a pill costing more than the balance is
 * disabled, so the Bet can never outrun the Session. Interactive only while
 * the machine is idle — the whole component is disabled otherwise.
 */

interface BetSelectorProps {
  /** The current stake. */
  bet: Bet;
  /** The Session balance — pills above it are disabled. */
  credits: number;
  /** False while a Hand is on the felt: a stake is chosen only before a Deal. */
  enabled: boolean;
  onSelect: (bet: Bet) => void;
}

export default function BetSelector({
  bet,
  credits,
  enabled,
  onSelect,
}: BetSelectorProps) {
  return (
    <div
      aria-label="Bet"
      className="flex items-center gap-1.5 sm:gap-2"
      role="group"
    >
      <span className="mr-1 font-serif text-[0.7rem] font-bold tracking-[0.35em] text-gold uppercase">
        Bet
      </span>
      {BET_VALUES.map((option) => {
        const active = option === bet;
        const disabled = !enabled || option > credits;
        return (
          <button
            aria-current={active ? "true" : undefined}
            aria-label={`BET ${option}`}
            className={`h-8 w-8 rounded-full font-mono text-sm font-bold tabular-nums ring-1 transition-[filter,opacity] sm:h-9 sm:w-9 ${
              active
                ? "bg-gold text-rail shadow-[0_0_12px_-2px_rgb(217_164_65/0.7)]"
                : "text-gold ring-gold/50"
            } ${
              disabled
                ? "cursor-not-allowed opacity-30"
                : "cursor-pointer hover:brightness-125"
            }`}
            disabled={disabled}
            key={option}
            onClick={() => onSelect(option)}
            type="button"
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
