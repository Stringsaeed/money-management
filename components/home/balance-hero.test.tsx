import { render, screen } from "@testing-library/react-native";

import { BalanceHero } from "@/components/home/balance-hero";

describe("BalanceHero", () => {
  it("renders a formatted balance", () => {
    render(<BalanceHero balanceCents={123_45} currency="USD" />);

    expect(screen.getByText("$123.45")).toBeOnTheScreen();
  });
});
