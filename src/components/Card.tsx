import { type Card, RANK_LABEL, SUIT_GLYPH, isRed } from "../engine/cards";

/**
 * A single playing card: cream face, rounded corners, soft shadow, rank +
 * suit in the top-left corner mirrored bottom-right, one large center pip.
 * Pure presentational — it knows nothing about holds, deals or the machine.
 */

const SIZES = {
  sm: { frame: "w-16", corner: "text-[0.6rem]", pip: "text-2xl" },
  md: { frame: "w-24", corner: "text-sm", pip: "text-5xl" },
  lg: { frame: "w-32", corner: "text-lg", pip: "text-6xl" },
} as const;

interface CardProps {
  card: Card;
  size?: keyof typeof SIZES;
}

export default function Card({ card, size = "md" }: CardProps) {
  const styles = SIZES[size];
  const suitColor = isRed(card.suit) ? "text-rose-600" : "text-zinc-900";
  const glyph = SUIT_GLYPH[card.suit];
  const corner = (
    <>
      <span>{RANK_LABEL[card.rank]}</span>
      <span>{glyph}</span>
    </>
  );

  return (
    <div
      className={`${styles.frame} relative aspect-[2/3] rounded-lg bg-cream shadow-md ${suitColor}`}
    >
      <div
        className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${styles.corner}`}
      >
        {corner}
      </div>
      <div
        aria-hidden="true"
        className={`grid h-full place-items-center leading-none ${styles.pip}`}
      >
        {glyph}
      </div>
      <div
        aria-hidden="true"
        className={`absolute right-1.5 bottom-1 flex rotate-180 flex-col items-center leading-none ${styles.corner}`}
      >
        {corner}
      </div>
    </div>
  );
}
