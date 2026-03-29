import { renderHook } from "@testing-library/react-native";

import { createAccountWithBalance, createCategory } from "@/tests/test-utils/factories";
import { useUIStore } from "@/stores/ui-store";
import { useHomeHeaderItems } from "@/utils/home-header-items";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseAccountsWithBalances = jest.fn();
const mockUseCategories = jest.fn();
const mockUseTransactionDateRange = jest.fn();

jest.mock("@/hooks/use-accounts", () => ({
  useAccountsWithBalances: () => mockUseAccountsWithBalances(),
}));

jest.mock("@/hooks/use-categories", () => ({
  useCategories: () => mockUseCategories(),
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactionDateRange: () => mockUseTransactionDateRange(),
}));

describe("useHomeHeaderItems", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("builds navigation and filter menus with active badge state", () => {
    useUIStore.setState({
      activeAccountId: "account-1",
      selectedYear: 2026,
      selectedMonth: 3,
      selectedCategoryId: "category-1",
    });

    mockUseAccountsWithBalances.mockReturnValue({
      data: [createAccountWithBalance({ id: "account-1", name: "Wallet" })],
    });
    mockUseCategories.mockReturnValue({
      data: [createCategory({ id: "category-1", name: "Food" })],
    });
    mockUseTransactionDateRange.mockReturnValue({
      data: { minDate: "2026-01-01", maxDate: "2026-03-28" },
    });

    const { result } = renderHook(() => useHomeHeaderItems());

    expect(result.current.headerLeftItems[0]?.type).toBe("menu");
    expect(result.current.headerRightItems[0]).toMatchObject({
      type: "menu",
      badge: { value: 3 },
    });

    const navigationItem = result.current.headerLeftItems[0] as any;
    const filtersItem = result.current.headerRightItems[0] as any;
    const addEntryItem = result.current.headerRightItems[1] as any;

    expect(navigationItem?.menu?.items).toHaveLength(4);

    navigationItem?.menu?.items[0]?.onPress?.();
    navigationItem?.menu?.items[3]?.onPress?.();
    addEntryItem?.onPress?.();

    expect(mockPush).toHaveBeenCalledWith("/ledger");
    expect(mockPush).toHaveBeenCalledWith("/settings");
    expect(mockPush).toHaveBeenCalledWith("/transaction/new");

    const accountMenu = filtersItem?.menu?.items[0];
    const periodMenu = filtersItem?.menu?.items[1];
    const categoryMenu = filtersItem?.menu?.items[2];

    accountMenu?.items?.[0]?.onPress?.();
    expect(useUIStore.getState().activeAccountId).toBeNull();

    periodMenu?.items?.[0]?.onPress?.();
    expect(useUIStore.getState().selectedMonth).toBeNull();

    categoryMenu?.items?.[0]?.onPress?.();
    expect(useUIStore.getState().selectedCategoryId).toBeNull();
  });

  it("omits the filter badge when no filters are active", () => {
    useUIStore.setState({
      activeAccountId: null,
      selectedYear: null,
      selectedMonth: null,
      selectedCategoryId: null,
    });

    mockUseAccountsWithBalances.mockReturnValue({ data: [] });
    mockUseCategories.mockReturnValue({ data: [] });
    mockUseTransactionDateRange.mockReturnValue({ data: null });

    const { result } = renderHook(() => useHomeHeaderItems());

    const filtersItem = result.current.headerRightItems[0] as any;

    expect(filtersItem?.badge).toBeUndefined();
    expect(filtersItem?.menu?.items).toHaveLength(3);
  });
});
