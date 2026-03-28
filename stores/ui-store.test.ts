import { useUIStore } from "@/stores/ui-store";

describe("useUIStore", () => {
  it("updates filters and resets them", () => {
    useUIStore.getState().setSelectedMonth(2026, 3);
    useUIStore.getState().setActiveAccountId("account-1");
    useUIStore.getState().setSelectedCategoryId("category-1");

    expect(useUIStore.getState()).toMatchObject({
      selectedYear: 2026,
      selectedMonth: 3,
      activeAccountId: "account-1",
      selectedCategoryId: "category-1",
    });

    useUIStore.getState().resetFilters();

    expect(useUIStore.getState()).toMatchObject({
      selectedYear: null,
      selectedMonth: null,
      activeAccountId: null,
      selectedCategoryId: null,
    });
  });
});
