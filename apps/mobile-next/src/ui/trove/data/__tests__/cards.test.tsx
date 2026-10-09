import { render, screen } from "@testing-library/react-native";

import { BalanceCard } from "../balance-card";
import { Card } from "../card";

describe("BalanceCard", () => {
  it("shows label, total, delta and caption", async () => {
    await render(
      <BalanceCard
        caption="this month · 3 accounts"
        currency="USD"
        deltaMinor={32014}
        label="Total balance"
        minor={1248050}
      />,
    );
    expect(screen.getByText("Total balance")).toBeTruthy();
    expect(screen.getByLabelText(/12,480\.50/)).toBeTruthy();
    expect(screen.getByLabelText(/^plus .*320\.14/)).toBeTruthy();
    expect(screen.getByText("this month · 3 accounts")).toBeTruthy();
  });

  it("omits the footer when there is no delta or caption", async () => {
    await render(<BalanceCard currency="USD" label="Total balance" minor={100} />);
    expect(screen.queryByText("this month · 3 accounts")).toBeNull();
  });

  it("shows a negative delta with a minus", async () => {
    await render(<BalanceCard currency="USD" deltaMinor={-5000} label="Total" minor={100} />);
    expect(screen.getByText("−")).toBeTruthy();
  });
});

describe("Card", () => {
  it("renders children", async () => {
    await render(
      <Card elevation="level2">
        <BalanceCard currency="USD" label="Inside" minor={0} />
      </Card>,
    );
    expect(screen.getByText("Inside")).toBeTruthy();
  });
});
