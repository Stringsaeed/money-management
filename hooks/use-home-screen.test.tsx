import { renderHook } from "@testing-library/react-native";

import { useHomeScreen } from "@/hooks/use-home-screen";
import {
  createAccountWithBalance,
  createCategory,
  createTransactionWithDetails,
} from "@/tests/test-utils/factories";

const mockUseAccountsWithBalances = jest.fn();
const mockUseCategories = jest.fn();
const mockUseTransactions = jest.fn();
const mockUseTransactionDateRange = jest.fn();
const mockUseRecurringProcessor = jest.fn();

jest.mock("@/hooks/use-accounts", () => ({
  useAccountsWithBalances: () => mockUseAccountsWithBalances(),
}));

jest.mock("@/hooks/use-categories", () => ({
  useCategories: () => mockUseCategories(),
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactions: (...args: unknown[]) => mockUseTransactions(...args),
  useTransactionDateRange: () => mockUseTransactionDateRange(),
}));

jest.mock("@/hooks/use-recurring-processor", () => ({
  useRecurringProcessor: () => mockUseRecurringProcessor(),
}));

describe("useHomeScreen", () => {
  it("wires query data, store filters, and grouped transactions", () => {
    mockUseAccountsWithBalances.mockReturnValue({
      data: [
        createAccountWithBalance({ id: "account-1", currency: "EUR", balance: 100_00 }),
        createAccountWithBalance({ id: "account-2", currency: "USD", balance: 50_00 }),
      ],
      isLoading: false,
    });
    mockUseCategories.mockReturnValue({
      data: [
        createCategory({ id: "category-1", name: "Groceries" }),
        createCategory({ id: "category-2", name: "Salary", type: "income", icon: "💼" }),
      ],
    });
    mockUseTransactions.mockReturnValue({
      data: [
        createTransactionWithDetails({
          id: "transaction-1",
          date: "2026-03-28",
          currency: "EUR",
          category: { id: "category-1", name: "Groceries", color: "#B48A7B", icon: "🛒" },
        }),
      ],
      isLoading: false,
    });
    mockUseTransactionDateRange.mockReturnValue({
      data: { minDate: "2026-01-01", maxDate: "2026-03-28" },
    });
    const { result } = renderHook(() => useHomeScreen());

    expect(mockUseRecurringProcessor).toHaveBeenCalled();
    expect(result.current.accounts).toHaveLength(2);
    expect(result.current.groups).toHaveLength(1);
    expect(result.current.currency).toBe("EUR");
    expect(result.current.dateRange).toEqual({ minDate: "2026-01-01", maxDate: "2026-03-28" });
    expect(result.current.loadingAccounts).toBe(false);
    expect(result.current.loadingTx).toBe(false);
  });

  it("passes filters to SQL query and falls back to account currency", () => {
    const { useUIStore } = jest.requireActual("@/stores/ui-store");

    useUIStore.setState({
      selectedYear: 2026,
      selectedMonth: 3,
      activeAccountId: "account-1",
      selectedCategoryId: "category-2",
    });

    mockUseAccountsWithBalances.mockReturnValue({
      data: [createAccountWithBalance({ id: "account-1", currency: "GBP", balance: 100_00 })],
      isLoading: false,
    });
    mockUseCategories.mockReturnValue({
      data: [createCategory({ id: "category-2", name: "Salary", type: "income", icon: "💼" })],
    });
    mockUseTransactions.mockReturnValue({
      data: [
        createTransactionWithDetails({
          id: "transaction-2",
          type: "income",
          category: { id: "category-2", name: "Salary", color: "#8B9D83", icon: "💼" },
        }),
      ],
      isLoading: false,
    });
    mockUseTransactionDateRange.mockReturnValue({
      data: { minDate: "2026-01-01", maxDate: "2026-03-28" },
    });

    const { result } = renderHook(() => useHomeScreen());

    expect(mockUseTransactions).toHaveBeenCalledWith({
      year: 2026,
      month: 3,
      accountId: "account-1",
      categoryId: "category-2",
      limit: undefined,
    });
    expect(result.current.groups[0]?.transactions).toHaveLength(1);
    expect(result.current.activeFilterCount).toBe(3);
    expect(result.current.activeAccount?.id).toBe("account-1");
    expect(result.current.activeCategory?.id).toBe("category-2");
    expect(result.current.currency).toBe("GBP");
  });

  it("falls back from transaction currency to the default USD when no account currency exists", () => {
    mockUseAccountsWithBalances.mockReturnValue({
      data: [createAccountWithBalance({ id: "account-1", currency: undefined })],
      isLoading: true,
    });
    mockUseCategories.mockReturnValue({ data: [] });
    mockUseTransactions.mockReturnValue({
      data: [createTransactionWithDetails({ currency: "JPY" })],
      isLoading: true,
    });
    mockUseTransactionDateRange.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useHomeScreen());

    expect(result.current.currency).toBe("JPY");
    expect(result.current.loadingAccounts).toBe(true);
    expect(result.current.loadingTx).toBe(true);
  });

  it("falls back to USD when no currencies are available anywhere", () => {
    mockUseAccountsWithBalances.mockReturnValue({ data: [], isLoading: false });
    mockUseCategories.mockReturnValue({ data: [] });
    mockUseTransactions.mockReturnValue({ data: [], isLoading: false });
    mockUseTransactionDateRange.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useHomeScreen());

    expect(result.current.currency).toBe("USD");
    expect(result.current.activeFilterCount).toBe(0);
  });
});
