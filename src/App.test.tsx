import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { lcg } from "./engine/testing";

beforeEach(() => {
  vi.spyOn(Math, "random").mockImplementation(lcg(42));
});

/** The card frames currently on the felt, via each card's center pip div. */
function feltCards(): string[] {
  return screen
    .getAllByText(/^[♠♥♦♣]$/)
    .filter((pip) => pip.tagName === "DIV")
    .map((pip) => pip.parentElement?.textContent ?? "");
}

describe("App", () => {
  it("renders the masthead of the casino table shell", () => {
    render(<App />);

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent(/video poker/i);
    expect(heading).toHaveTextContent(/jacks or better/i);
  });

  it("shows five empty slots and a DEAL button while idle", () => {
    render(<App />);

    expect(screen.getAllByTestId("empty-slot")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "DEAL" })).toBeInTheDocument();
  });

  it("deals five cards on DEAL and flips the button to NEW HAND", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "DEAL" }));

    // Five face-up cards: each shows exactly one center pip glyph.
    expect(feltCards()).toHaveLength(5);
    expect(screen.queryAllByTestId("empty-slot")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "NEW HAND" }),
    ).toBeInTheDocument();
  });

  it("returns to five empty slots on NEW HAND", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "DEAL" }));
    await user.click(screen.getByRole("button", { name: "NEW HAND" }));

    expect(screen.getAllByTestId("empty-slot")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "DEAL" })).toBeInTheDocument();
  });

  it("deals different hands across deals", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "DEAL" }));
    const before = feltCards();

    await user.click(screen.getByRole("button", { name: "NEW HAND" }));
    await user.click(screen.getByRole("button", { name: "DEAL" }));
    const after = feltCards();

    expect(after).not.toEqual(before);
  });
});
