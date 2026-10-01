import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";
import { lcg } from "./engine/testing";

describe("App", () => {
  it("renders the masthead of the casino table shell", () => {
    render(<App />);

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent(/video poker/i);
    expect(heading).toHaveTextContent(/jacks or better/i);
  });

  it("shows five empty slots, a DEAL button and no card buttons while idle", () => {
    render(<App />);

    expect(screen.getAllByTestId("empty-slot")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "DEAL" })).toBeInTheDocument();
    expect(cardButtons()).toHaveLength(0);
  });

  it("deals five holdable cards on DEAL and flips the button to DRAW", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "DEAL" }));

    // Five face-up cards: each shows exactly one center pip glyph.
    expect(feltCards()).toHaveLength(5);
    expect(screen.queryAllByTestId("empty-slot")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "DRAW" })).toBeInTheDocument();
    // Cards are toggle buttons now, none pressed, none disabled while dealt.
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(5);
  });

  it("toggles HOLD on a card and back again", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "DEAL" }));

    await user.click(screen.getAllByRole("button", { pressed: false })[1]);
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    expect(screen.getAllByText("HOLD")).toHaveLength(1);

    await user.click(screen.getAllByRole("button", { pressed: true })[0]);
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(5);
    expect(screen.queryAllByText("HOLD")).toHaveLength(0);
  });

  it("a full hand cycle: holds survive the Draw, unheld cards are replaced", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "DEAL" }));

    const before = feltCards();
    const holds = screen.getAllByRole("button", { pressed: false });
    await user.click(holds[0]);
    await user.click(holds[2]);

    await user.click(screen.getByRole("button", { name: "DRAW" }));

    const after = feltCards();
    // Held slots untouched; the other three genuinely replaced.
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
    for (const i of [1, 3, 4]) expect(after[i]).not.toBe(before[i]);
    // The settled ResultBanner names the final Hand and its payout; only
    // NEW HAND is offered.
    expect(screen.getByTestId("result-banner")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "NEW HAND" }),
    ).toBeInTheDocument();
    // Settled cards are marked aria-disabled and clicking one changes nothing.
    for (const card of cardButtons())
      expect(card).toHaveAttribute("aria-disabled", "true");
    await user.click(cardButtons()[0]);
    expect(
      screen.getByRole("button", { name: "NEW HAND" }),
    ).toBeInTheDocument();
  });

  it("returns to five empty slots on NEW HAND", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "DEAL" }));
    await user.click(screen.getByRole("button", { name: "DRAW" }));
    await user.click(screen.getByRole("button", { name: "NEW HAND" }));

    expect(screen.getAllByTestId("empty-slot")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "DEAL" })).toBeInTheDocument();
  });

  it("deals different hands across deals", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "DEAL" }));
    const before = feltCards();

    await user.click(screen.getByRole("button", { name: "DRAW" }));
    await user.click(screen.getByRole("button", { name: "NEW HAND" }));
    await user.click(screen.getByRole("button", { name: "DEAL" }));
    const after = feltCards();

    expect(after).not.toEqual(before);
  });
});

describe("the economy", () => {
  it("opens with 100 credits, bet 1 lit, and the paytable at 1×", () => {
    render(<App />);

    expect(credits()).toHaveTextContent("100");
    expect(screen.getByRole("button", { name: "BET 1" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(paytableRow("Royal Flush")).toHaveTextContent("250");
  });

  it("raises the stake and rescales every paytable row", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "BET 3" }));

    expect(screen.getByRole("button", { name: "BET 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(paytableRow("Royal Flush")).toHaveTextContent("750");
    expect(credits()).toHaveTextContent("100");
  });

  it("DEAL deducts exactly the stake from the rail", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "BET 3" }));
    await user.click(screen.getByRole("button", { name: "DEAL" }));

    expect(credits()).toHaveTextContent("97");
  });

  it("busting the Session shows the game-over overlay, whose only action is NEW SESSION", async () => {
    const user = userEvent.setup();
    // Seed 17 at bet 5: twenty losing hands in a row, then bust.
    render(<App rng={lcg(17)} />);

    await user.click(screen.getByRole("button", { name: "BET 5" }));
    for (let hand = 1; hand <= 19; hand++) {
      await user.click(screen.getByRole("button", { name: "DEAL" }));
      // Dealt (not settled) can never end the Session.
      expect(screen.queryByTestId("game-over-overlay")).toBeNull();
      await user.click(screen.getByRole("button", { name: "DRAW" }));
      // Settled, still on the felt — a settled Hand above one credit is safe.
      expect(screen.queryByTestId("game-over-overlay")).toBeNull();
      await user.click(screen.getByRole("button", { name: "NEW HAND" }));
    }
    expect(credits()).toHaveTextContent("5");

    // The twentieth hand: Deal drains the last 5, the silent Draw settles at 0.
    await user.click(screen.getByRole("button", { name: "DEAL" }));
    expect(credits()).toHaveTextContent("0");
    expect(screen.queryByTestId("game-over-overlay")).toBeNull();
    await user.click(screen.getByRole("button", { name: "DRAW" }));

    const overlay = screen.getByTestId("game-over-overlay");
    expect(within(overlay).getByText("GAME OVER")).toBeInTheDocument();
    const actions = screen.getAllByRole("button");
    expect(actions).toHaveLength(1);
    expect(actions[0]).toHaveAccessibleName("NEW SESSION");

    await user.click(actions[0]);

    expect(screen.queryByTestId("game-over-overlay")).toBeNull();
    expect(credits()).toHaveTextContent("100");
    expect(screen.getByRole("button", { name: "BET 1" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "DEAL" })).toBeInTheDocument();
  });
});

/** The CREDITS readout on the rail. */
function credits(): HTMLElement {
  return screen.getByTestId("credits");
}

/** The Paytable row carrying this Rank label. */
function paytableRow(label: string): HTMLElement {
  const row = screen.getByText(label).closest("li");
  if (row === null) throw new Error(`no paytable row for "${label}"`);
  return row;
}

/** Identity text of each card on the felt (center pip's parent frame), with
 * the HOLD tab label stripped so held cards compare equal across the Draw. */
function feltCards(): string[] {
  return screen
    .getAllByText(/^[♠♥♦♣]$/)
    .filter((pip) => pip.tagName === "DIV")
    .map((pip) =>
      (pip.parentElement?.textContent ?? "").replaceAll("HOLD", ""),
    );
}

/** The card frames on the felt, identified by their aria-pressed attribute. */
function cardButtons(): HTMLElement[] {
  return screen
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-pressed"));
}
