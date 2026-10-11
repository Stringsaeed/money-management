import { fireEvent, render, screen } from "@testing-library/react-native";

import { MarketRow } from "../market-row";
import { marketChangeLabel, sparklinePath } from "../utils";

const SERIES = [58, 59, 58.5, 60, 59.4, 61, 61.2];

describe("MarketRow", () => {
  it("speaks name, symbol, price and change as one label", async () => {
    await render(
      <MarketRow
        changePercent={2.4}
        name="Bitcoin"
        price="61240.18"
        sparkline={SERIES}
        symbol="BTC"
      />,
    );
    expect(screen.getByLabelText("Bitcoin, BTC, 61,240.18 USD, up 2.4 percent")).toBeTruthy();
  });

  it("speaks every kept digit of a sub-cent price", async () => {
    await render(
      <MarketRow
        changePercent={-3.8}
        name="Shiba Inu"
        price="0.00001842"
        sparkline={SERIES}
        symbol="SHIB"
      />,
    );
    expect(screen.getByLabelText("Shiba Inu, SHIB, 0.00001842 USD, down 3.8 percent")).toBeTruthy();
    expect(screen.getByText("001842")).toBeTruthy();
    expect(screen.getByText("▼ 3.8%")).toBeTruthy();
  });

  it("renders the symbol, name and an up badge", async () => {
    await render(
      <MarketRow
        changePercent={5.2}
        name="Dogecoin"
        price="0.1834"
        sparkline={SERIES}
        symbol="DOGE"
      />,
    );
    expect(screen.getByText("DOGE")).toBeTruthy();
    expect(screen.getByText("Dogecoin")).toBeTruthy();
    expect(screen.getByText("▲ 5.2%")).toBeTruthy();
  });

  it("is a button only when pressable", async () => {
    const onPress = jest.fn();
    await render(
      <MarketRow
        changePercent={0.3}
        name="Gold"
        onPress={onPress}
        price="2384.40"
        sparkline={SERIES}
        symbol="XAU"
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: /Gold, XAU/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no button role without a handler", async () => {
    await render(
      <MarketRow changePercent={0.3} name="Gold" price="2384.40" sparkline={SERIES} symbol="XAU" />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("market utils", () => {
  it("labels the change with an arrow instead of a sign", () => {
    expect(marketChangeLabel(2.4)).toBe("▲ 2.4%");
    expect(marketChangeLabel(-1.1)).toBe("▼ 1.1%");
    expect(marketChangeLabel(0)).toBe("0.0%");
  });

  it("draws a 56x24 polyline from low-left to high-right", () => {
    const path = sparklinePath([1, 2]);
    expect(path).toBe("M2.0 21.0 L54.0 3.0");
  });

  it("draws a flat line for a flat series and nothing for a single point", () => {
    expect(sparklinePath([5, 5, 5])).toBe("M2.0 21.0 L28.0 21.0 L54.0 21.0");
    expect(sparklinePath([5])).toBe("");
    expect(sparklinePath([])).toBe("");
  });
});
