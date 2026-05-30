import { act, render, screen } from "@testing-library/react-native";

import { BalanceHero } from "@/components/home/balance-hero";
import { useUIStore } from "@/stores/ui-store";

jest.mock("@/hooks/use-accounts", () => ({
  useAccountsWithBalances: () => ({
    data: [{ id: "account-1", currency: "USD", balance: 123_45 }],
  }),
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactions: () => ({ data: [] }),
}));

describe("BalanceHero", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useUIStore.setState({
      selectedYear: null,
      selectedMonth: null,
      activeAccountId: null,
      selectedCategoryId: null,
    });
  });

  it("renders total account balance when no filters are active", () => {
    render(<BalanceHero />);
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText("$123.45")).toBeOnTheScreen();
  });
});
