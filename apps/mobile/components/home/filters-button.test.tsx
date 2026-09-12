// oxlint-disable anti-slop/no-module-mocking -- ledger query boundaries for FiltersButton UI tests.
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FiltersButton } from "@/components/home/filters-button";
import { useUIStore } from "@/stores/ui-store";

jest.mock("@/hooks/use-accounts", () => ({
  useAccountsWithBalances: () => ({
    data: [{ id: "account-1", name: "Wallet" }],
  }),
}));

jest.mock("@/hooks/use-categories", () => ({
  useAllCategories: () => ({
    data: [{ id: "category-1", name: "Food" }],
  }),
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactionDateRange: () => ({
    data: { minDate: "2026-01-01", maxDate: "2026-03-01" },
  }),
}));

describe("FiltersButton", () => {
  beforeEach(() => {
    useUIStore.setState({
      activeAccountId: null,
      selectedYear: null,
      selectedMonth: null,
      selectedCategoryId: null,
    });
  });

  it("does not mount the filters sheet portal while closed", async () => {
    await render(<FiltersButton />);

    expect(screen.queryByText("All Accounts")).toBeNull();
    expect(screen.queryByText("All Categories")).toBeNull();
  });

  it("mounts the filters sheet after opening", async () => {
    await render(<FiltersButton />);

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByText("All Accounts")).toBeOnTheScreen();
    expect(screen.getByText("Wallet")).toBeOnTheScreen();
  });
});
