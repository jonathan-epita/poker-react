import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the masthead of the casino table shell", () => {
    render(<App />);

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent(/video poker/i);
    expect(heading).toHaveTextContent(/jacks or better/i);
  });

  it("shows the display hand — a royal flush in spades — on the felt", () => {
    render(<App />);

    for (const rank of ["A", "K", "Q", "J", "10"]) {
      expect(screen.getAllByText(rank).length).toBeGreaterThan(0);
    }
  });
});
