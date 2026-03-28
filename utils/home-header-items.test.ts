import { createAccountWithBalance, createCategory } from "@/tests/test-utils/factories";
import { buildHomeHeaderItems } from "@/utils/home-header-items";

describe("buildHomeHeaderItems", () => {
  it("builds navigation and filter menus with active badge state", () => {
    const push = jest.fn();
    const setActiveAccountId = jest.fn();
    const setSelectedMonth = jest.fn();
    const setSelectedCategoryId = jest.fn();
    const resetFilters = jest.fn();

    const { headerLeftItems, headerRightItems } = buildHomeHeaderItems({
      router: { push } as never,
      accounts: [createAccountWithBalance({ id: "account-1", name: "Wallet" })],
      allCategories: [createCategory({ id: "category-1", name: "Food" })],
      dateRange: { minDate: "2026-01-01", maxDate: "2026-03-28" },
      activeAccountId: "account-1",
      selectedYear: 2026,
      selectedMonth: 3,
      selectedCategoryId: "category-1",
      activeFilterCount: 3,
      setActiveAccountId,
      setSelectedMonth,
      setSelectedCategoryId,
      resetFilters,
    });

    expect(headerLeftItems[0]?.type).toBe("menu");
    expect(headerRightItems[0]).toMatchObject({
      type: "menu",
      badge: { value: 3 },
    });

    const navigationItem = headerLeftItems[0] as any;
    const filtersItem = headerRightItems[0] as any;
    const addEntryItem = headerRightItems[1] as any;

    expect(navigationItem?.menu?.items).toHaveLength(4);
    expect(filtersItem?.menu?.items).toHaveLength(4);

    navigationItem?.menu?.items[0]?.onPress?.();
    navigationItem?.menu?.items[3]?.onPress?.();
    addEntryItem?.onPress?.();

    const accountMenu = filtersItem?.menu?.items[0];
    const periodMenu = filtersItem?.menu?.items[1];
    const categoryMenu = filtersItem?.menu?.items[2];
    const resetItem = filtersItem?.menu?.items[3];

    accountMenu?.items?.[0]?.onPress?.();
    accountMenu?.items?.[1]?.onPress?.();
    periodMenu?.items?.[0]?.onPress?.();
    periodMenu?.items?.[1]?.onPress?.();
    categoryMenu?.items?.[0]?.onPress?.();
    categoryMenu?.items?.[1]?.onPress?.();
    resetItem?.onPress?.();

    expect(push).toHaveBeenCalledWith("/ledger");
    expect(push).toHaveBeenCalledWith("/settings");
    expect(push).toHaveBeenCalledWith("/transaction/new");
    expect(setActiveAccountId).toHaveBeenNthCalledWith(1, null);
    expect(setActiveAccountId).toHaveBeenNthCalledWith(2, null);
    expect(setSelectedMonth).toHaveBeenNthCalledWith(1, null, null);
    expect(setSelectedMonth).toHaveBeenNthCalledWith(2, null, null);
    expect(setSelectedCategoryId).toHaveBeenNthCalledWith(1, null);
    expect(setSelectedCategoryId).toHaveBeenNthCalledWith(2, null);
    expect(resetFilters).toHaveBeenCalled();
  });

  it("omits the filter badge and reset action when no filters are active", () => {
    const { headerRightItems } = buildHomeHeaderItems({
      router: { push: jest.fn() } as never,
      accounts: [],
      allCategories: [],
      dateRange: null,
      activeAccountId: null,
      selectedYear: null,
      selectedMonth: null,
      selectedCategoryId: null,
      activeFilterCount: 0,
      setActiveAccountId: jest.fn(),
      setSelectedMonth: jest.fn(),
      setSelectedCategoryId: jest.fn(),
      resetFilters: jest.fn(),
    });

    const filtersItem = headerRightItems[0] as any;

    expect(filtersItem?.badge).toBeUndefined();
    expect(filtersItem?.menu?.items).toHaveLength(3);
  });
});
