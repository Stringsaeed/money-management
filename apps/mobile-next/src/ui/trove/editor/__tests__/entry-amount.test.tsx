import { render, screen } from "@testing-library/react-native";

import { EntryAmount } from "../entry-amount";

describe("EntryAmount", () => {
  it("is one labelled text element", async () => {
    await render(<EntryAmount currency="USD" negative value="64.2" />);
    expect(screen.getByLabelText("minus 64.20 USD")).toBeTruthy();
  });

  it("draws the typed digits and the faded cents", async () => {
    await render(<EntryAmount currency="USD" value="64.2" />);
    for (const char of ["6", "4", ".", "2", "0"]) {
      expect(screen.getAllByText(char, { includeHiddenElements: true }).length).toBeGreaterThan(0);
    }
  });

  it("shows no minus unless negative", async () => {
    await render(<EntryAmount currency="USD" value="5" />);
    expect(screen.queryByText("−", { includeHiddenElements: true })).toBeNull();
    await screen.rerender(<EntryAmount currency="USD" negative value="5" />);
    expect(screen.getByText("−", { includeHiddenElements: true })).toBeTruthy();
  });

  it("draws a glyph for dirham amounts", async () => {
    await render(<EntryAmount currency="AED" value="12" />);
    expect(screen.getByTestId("nano-icon-dirham", { includeHiddenElements: true })).toBeTruthy();
  });
});
