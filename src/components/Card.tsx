import { type Card, RANK_LABEL, SUIT_GLYPH, isRed } from "../engine/cards";

/**
 * A single playing card: cream face, rounded corners, soft shadow, rank +
 * suit in the top-left corner mirrored bottom-right, one large center pip.
 * Pure presentational — it knows nothing about the machine. Passing
 * `onToggle` turns the card into a Hold button: gold ring, slight lift, and
 * a HOLD tab on its top edge while `held`. `disabled` marks the phases where
 * the machine forbids toggling (aria-disabled, no pointer cursor, inert).
 */

const SIZES = {
  sm: { frame: "w-16", corner: "text-[0.6rem]", pip: "text-2xl" },
  md: { frame: "w-24", corner: "text-sm", pip: "text-5xl" },
  lg: { frame: "w-32", corner: "text-lg", pip: "text-6xl" },
} as const;

interface CardProps {
  card: Card;
  size?: keyof typeof SIZES;
  /** True while this card is locked through the Draw. */
  held?: boolean;
  /** Toggles the Hold on click; its presence renders the card as a button. */
  onToggle?: () => void;
  /** The machine phase forbids Holds: aria-disabled, no pointer, no click. */
  disabled?: boolean;
}

export default function Card({
  card,
  size = "md",
  held = false,
  onToggle,
  disabled = false,
}: CardProps) {
  const styles = SIZES[size];
  const suitColor = isRed(card.suit) ? "text-rose-600" : "text-zinc-900";
  const glyph = SUIT_GLYPH[card.suit];
  const interactive = onToggle !== undefined;
  const corner = (
    <>
      <span>{RANK_LABEL[card.rank]}</span>
      <span>{glyph}</span>
    </>
  );

  const frame = [
    styles.frame,
    "relative aspect-[2/3] rounded-lg bg-cream shadow-md",
    suitColor,
    interactive && "border-0 p-0 text-left [font:inherit]",
    held && "-translate-y-2 ring-2 ring-gold",
    interactive && (disabled ? "cursor-default" : "cursor-pointer"),
  ]
    .filter(Boolean)
    .join(" ");

  const face = (
    <>
      <div
        className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${styles.corner}`}
      >
        {corner}
      </div>
      <div
        aria-hidden="true"
        className={`grid h-full w-full place-items-center leading-none ${styles.pip}`}
      >
        {glyph}
      </div>
      <div
        aria-hidden="true"
        className={`absolute right-1.5 bottom-1 flex rotate-180 flex-col items-center leading-none ${styles.corner}`}
      >
        {corner}
      </div>
      {interactive && held && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-2 z-10 mx-auto w-fit rounded bg-gold px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.2em] text-rail uppercase"
        >
          HOLD
        </div>
      )}
    </>
  );

  if (!interactive) {
    return <div className={frame}>{face}</div>;
  }
  return (
    <button
      type="button"
      aria-pressed={held}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onToggle}
      className={frame}
    >
      {face}
    </button>
  );
}
