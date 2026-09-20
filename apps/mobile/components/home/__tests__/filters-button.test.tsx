// oxlint-disable anti-slop/no-module-mocking -- ledger query boundaries for FiltersButton UI tests.
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FiltersButton } from "@/components/home/filters-button";
import { useUIStore } from "@/stores/ui-store";

const TEST_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const TEST_FRAME = { x: 0, y: 0, width: 375, height: 812 };

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={{ insets: TEST_INSETS, frame: TEST_FRAME }}>
      {children}
    </SafeAreaProvider>
  );
}

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
    await render(<FiltersButton />, { wrapper: Wrapper });

    expect(screen.queryByText("All Accounts")).toBeNull();
    expect(screen.queryByText("All Categories")).toBeNull();
  });

  it("mounts the filters sheet after opening", async () => {
    await render(<FiltersButton />, { wrapper: Wrapper });

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByText("All Accounts")).toBeOnTheScreen();
    expect(screen.getByText("Wallet")).toBeOnTheScreen();
  });
});
