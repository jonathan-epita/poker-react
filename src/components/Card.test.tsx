import { fireEvent, render, screen } from "@testing-library/react";
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

  it("renders a plain div with no Hold affordance when not toggleable", () => {
    const { container } = render(<Card card={ACE_OF_SPADES} />);

    expect(container.firstElementChild?.tagName).toBe("DIV");
    expect(container).not.toHaveTextContent("HOLD");
  });

  it("renders as a pressed button with a HOLD tab when held and toggleable", () => {
    const { container } = render(
      <Card card={ACE_OF_SPADES} held onToggle={() => undefined} />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("ring-gold");
    expect(button).toHaveClass("-translate-y-2");
    expect(screen.getByText("HOLD")).toBeInTheDocument();
    expect(container.firstElementChild?.tagName).toBe("BUTTON");
  });

  it("is aria-disabled without a pointer cursor when the phase forbids Holds", () => {
    render(
      <Card card={QUEEN_OF_HEARTS} held onToggle={() => undefined} disabled />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveClass("cursor-default");
    // aria-disabled keeps it focusable, but the click never reaches the machine.
    fireEvent.click(button);
  });
});
