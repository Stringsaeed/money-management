import { render, screen } from "@testing-library/react-native";

import { CurrencyBadge } from "../currency-badge";
import { currencyName } from "../currency-name";

describe("CurrencyBadge", () => {
  it("is labelled with the currency name", async () => {
    await render(<CurrencyBadge code="EUR" />);
    expect(screen.getByLabelText("Euro")).toBeTruthy();
    expect(screen.getByText("€", { includeHiddenElements: true })).toBeTruthy();
  });

  it("draws the dirham and riyal as glyphs, not text", async () => {
    await render(<CurrencyBadge code="AED" size={48} />);
    expect(screen.getByLabelText("UAE dirham")).toBeTruthy();
    expect(screen.getByTestId("nano-icon-dirham", { includeHiddenElements: true })).toBeTruthy();
    await render(<CurrencyBadge code="SAR" size={24} />);
    expect(screen.getByLabelText("Saudi riyal")).toBeTruthy();
  });

  it("falls back to the ISO code and honours an override", async () => {
    expect(currencyName("xyz")).toBe("XYZ");
    await render(<CurrencyBadge accessibilityLabel="Home currency" code="USD" />);
    expect(screen.getByLabelText("Home currency")).toBeTruthy();
  });
});
