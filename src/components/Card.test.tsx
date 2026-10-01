import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Card as EngineCard } from "../engine/cards";
import Card from "./Card";

const ACE_OF_SPADES: EngineCard = { rank: 14, suit: "S" };
const QUEEN_OF_HEARTS: EngineCard = { rank: 12, suit: "H" };

describe("Card", () => {
  it("shows the rank label and suit glyph for the ace of spades", () => {
    const { container } = render(<Card card={ACE_OF_SPADES} />);

    expect(container).toHaveTextContent("A");
    expect(container).toHaveTextContent("♠");
  });

  it("renders red suits in red", () => {
    const { container } = render(<Card card={QUEEN_OF_HEARTS} />);

    expect(container.firstElementChild).toHaveClass("text-rose-600");
    expect(container).toHaveTextContent("Q");
    expect(container).toHaveTextContent("♥");
  });

  it("renders black suits in near-black", () => {
    const { container } = render(<Card card={ACE_OF_SPADES} />);

    expect(container.firstElementChild).toHaveClass("text-zinc-900");
  });
});
