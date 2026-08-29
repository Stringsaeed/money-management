import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import LedgerScreen from "@/app/(tabs)/ledger";
import { AccountPicker } from "@/components/account/account-picker";
import { CategoryPicker } from "@/components/category/category-picker";
import { useHomeScreen } from "@/hooks/use-home-screen";
import type { LedgerSourceSelection } from "@/modules/ledger-data-source/provider";
import { useUIStore } from "@/stores/ui-store";
import { createMockDb } from "@/tests/test-utils/mock-db";
import { renderHookWithProviders, renderWithProviders } from "@/tests/test-utils/render";

const mockUseDatabase = jest.fn();
const mockUseSQLiteContext = jest.fn();
const mockListAccounts = jest.fn();
const mockListCategories = jest.fn();
const mockListTransactions = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockUseSQLiteContext(),
}));

jest.mock("@/hooks/use-account-visibility", () => ({
  hasVisibleAccount: () => true,
  useAccountVisibility: () => ({
    cacheKey: "local-only",
    isFiltering: false,
    visibleAccountIds: new Set(),
  }),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    ledger: {
      accounts: { list: (...args: unknown[]) => mockListAccounts(...args) },
      categories: { list: (...args: unknown[]) => mockListCategories(...args) },
      transactions: { list: (...args: unknown[]) => mockListTransactions(...args) },
    },
    commands: { apply: jest.fn() },
    sync: { getDelta: jest.fn() },
  },
}));

const ACCOUNT = {
  id: "account-1",
  name: "Main Checking",
  type: "checking" as const,
  currency: "USD",
  color: "#8B9D83",
  icon: "banknote.fill",
  initialBalance: 100_00,
  excludeFromTotal: false,
  sortOrder: 0,
  lifecycle: "active" as const,
  lifecycleChangedAt: null,
  createdAt: "2026-03-28T10:00:00.000Z",
  updatedAt: "2026-03-28T10:00:00.000Z",
};

const CATEGORY = {
  id: "category-1",
  name: "Groceries",
  type: "expense" as const,
  color: "#B48A7B",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  lifecycle: "active" as const,
  lifecycleChangedAt: null,
  createdAt: "2026-03-28T10:00:00.000Z",
  updatedAt: "2026-03-28T10:00:00.000Z",
};

const ENRICHED_TRANSACTION_ROW = {
  id: "transaction-1",
  type: "expense",
  amount: 40_00,
  currency: "USD",
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  date: "2026-03-28",
  accountId: "account-1",
  toAccountId: null,
  categoryId: "category-1",
  isRecurring: false,
  recurringRuleId: null,
  description: "Coffee",
  createdAt: "2026-03-28T10:00:00.000Z",
  updatedAt: "2026-03-28T10:00:00.000Z",
  accountName: "Main Checking",
  accountColor: "#8B9D83",
  accountIcon: "banknote.fill",
  accountCurrency: "USD",
  toAccountName: null,
  toAccountColor: null,
  toAccountIcon: null,
  toAccountCurrency: null,
  categoryName: "Groceries",
  categoryColor: "#B48A7B",
  categoryIcon: "🛒",
};

const SYNCED_ACCOUNT = {
  householdId: "household-1",
  ...ACCOUNT,
  type: "bank" as const,
  initialBalanceMinor: ACCOUNT.initialBalance,
  visibility: "public" as const,
  ownerUserId: "user-1",
  version: 0,
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: new Date(ACCOUNT.createdAt),
  updatedAt: new Date(ACCOUNT.updatedAt),
};

const SYNCED_CATEGORY = {
  householdId: "household-1",
  ...CATEGORY,
  version: 0,
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: new Date(CATEGORY.createdAt),
  updatedAt: new Date(CATEGORY.updatedAt),
};

const SYNCED_TRANSACTION = {
  householdId: "household-1",
  id: "transaction-1",
  type: "expense" as const,
  amountMinor: 40_00,
  currency: "USD",
  originalAmountMinor: null,
  originalCurrency: null,
  exchangeRate: null,
  date: "2026-03-28",
  accountId: "account-1",
  toAccountId: null,
  categoryId: "category-1",
  isRecurring: false,
  recurringRuleId: null,
  description: "Coffee",
  version: 0,
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: new Date("2026-03-28T10:00:00.000Z"),
  updatedAt: new Date("2026-03-28T10:00:00.000Z"),
};

const LOCAL_SELECTION = { kind: "local" } as const;
const SYNCED_SELECTION = { kind: "synced", householdId: "household-1" } as const;

const setExternalFixtures = (
  selection: LedgerSourceSelection,
  localSelectRows: readonly unknown[][] = [],
) => {
  const db = createMockDb({ selectResults: localSelectRows.map((all) => ({ all })) });
  mockUseDatabase.mockReturnValue(db);
  mockUseSQLiteContext.mockReturnValue({
    getAllAsync: jest.fn().mockResolvedValue([{ ...ACCOUNT, balance: 60_00, excludeFromTotal: 0 }]),
  });
  mockListAccounts.mockResolvedValue([SYNCED_ACCOUNT]);
  mockListCategories.mockResolvedValue([SYNCED_CATEGORY]);
  mockListTransactions.mockResolvedValue({
    transactions: [SYNCED_TRANSACTION],
    hasMore: false,
  });
  return {
    db,
    options: { ledgerSelection: selection },
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  useUIStore.setState({
    selectedYear: null,
    selectedMonth: null,
    activeAccountId: null,
    selectedCategoryId: null,
  });
});

describe.each([
  ["local", LOCAL_SELECTION],
  ["synced", SYNCED_SELECTION],
] as const)("%s ledger source", (_name, selection) => {
  it("drives the same Home and Ledger behavior", async () => {
    const hookFixture = setExternalFixtures(selection, [[ENRICHED_TRANSACTION_ROW]]);
    const { result } = await renderHookWithProviders(() => useHomeScreen(), hookFixture.options);

    await waitFor(() => expect(result.current.loadingTx).toBe(false));
    expect(result.current.accounts).toMatchObject([{ id: "account-1", balance: 60_00 }]);
    expect(result.current.groups[0]?.transactions).toMatchObject([
      { id: "transaction-1", description: "Coffee" },
    ]);

    const screenFixture = setExternalFixtures(selection, [[CATEGORY], [ENRICHED_TRANSACTION_ROW]]);
    await renderWithProviders(<LedgerScreen />, screenFixture.options);
    expect(await screen.findByText("Coffee")).toBeOnTheScreen();
  });

  it("drives the same Account and Category picker choices", async () => {
    const accountFixture = setExternalFixtures(selection, [[ACCOUNT]]);
    const onAccountChange = jest.fn();
    await renderWithProviders(
      <AccountPicker value={null} onChange={onAccountChange} />,
      accountFixture.options,
    );
    await fireEvent.press(await screen.findByText("Main Checking"));
    expect(onAccountChange).toHaveBeenCalledWith("account-1");

    const categoryFixture = setExternalFixtures(selection, [[CATEGORY]]);
    const onCategoryChange = jest.fn();
    await renderWithProviders(
      <CategoryPicker value={null} onChange={onCategoryChange} type="expense" />,
      categoryFixture.options,
    );
    await fireEvent.press(await screen.findByText("Groceries"));
    expect(onCategoryChange).toHaveBeenCalledWith("category-1");
  });
});
