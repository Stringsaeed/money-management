import { Alert } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import SettingsScreen from "@/app/(tabs)/settings";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCohereLedgerCache = jest.fn();
const mockUseDatabase = jest.fn();
const mockDelete = jest.fn(() => deleteBuilder);
const deleteBuilder = { where: jest.fn().mockResolvedValue(undefined) };
const updateBuilder = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue(undefined),
};
// Erasing rewinds the seed version via clearSeedVersion, which upserts.
const insertBuilder = {
  values: jest.fn().mockReturnThis(),
  onConflictDoUpdate: jest.fn().mockReturnThis(),
  run: jest.fn().mockResolvedValue(undefined),
};
const mockAccounts = [
  {
    id: "account-1",
    name: "Wallet",
    type: "checking",
    currency: "USD",
    color: "#8B9D83",
    icon: "banknote.fill",
    initialBalance: 100_00,
    balance: 250_00,
    excludeFromTotal: false,
    sortOrder: 0,
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-03-28T10:00:00.000Z",
  },
];
const mockExpenseCategories = [
  {
    id: "expense-1",
    name: "Food",
    type: "expense",
    color: "#B48A7B",
    icon: "🛒",
    parentId: null,
    sortOrder: 0,
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-03-28T10:00:00.000Z",
  },
];
const mockIncomeCategories = [
  {
    id: "income-1",
    name: "Salary",
    type: "income",
    color: "#8B9D83",
    icon: "💼",
    parentId: null,
    sortOrder: 0,
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-03-28T10:00:00.000Z",
  },
];
const mockRecurring = [
  {
    id: "recurring-1",
    name: "Rent",
    type: "expense",
    amountMinor: 1200_00,
    currency: "USD",
    accountId: "account-1",
    toAccountId: null,
    categoryId: "expense-1",
    description: "Monthly rent",
    frequency: "month",
    intervalCount: 1,
    startDate: "2026-01-01",
    endDate: null,
    endCount: null,
    timeZone: "Asia/Dubai",
    lifecycle: "active",
    health: "ready",
    attentionReasons: [],
    attentionDetails: null,
    eligibilityFloor: "2026-01-01",
    revision: 1,
    lifecycleChangedAt: null,
    healthChangedAt: null,
    lastSettlementAttemptAt: null,
    lastSettlementError: null,
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-03-28T10:00:00.000Z",
  },
];
const mockTransactions = [
  {
    id: "transaction-1",
    type: "expense",
    amount: 45_00,
    currency: "USD",
    originalAmount: null,
    originalCurrency: null,
    exchangeRate: null,
    date: "2026-03-28",
    accountId: "account-1",
    toAccountId: null,
    categoryId: "expense-1",
    description: "Coffee",
    recurringRuleId: null,
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-03-28T10:00:00.000Z",
    account: {
      id: "account-1",
      name: "Wallet",
      color: "#8B9D83",
      icon: "banknote.fill",
      currency: "USD",
    },
    toAccount: null,
    category: {
      id: "expense-1",
      name: "Food",
      color: "#B48A7B",
      icon: "🛒",
    },
  },
];

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock("@/modules/ledger-cache", () => ({
  cohereLedgerCache: (...args: unknown[]) => mockCohereLedgerCache(...args),
}));

jest.mock("@/db/client", () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock("expo-updates", () => ({
  channel: "preview",
}));

jest.mock("@/hooks/use-accounts", () => ({
  useAccountsWithBalances: () => ({
    data: mockAccounts,
  }),
  useCreateAccount: () => ({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-categories", () => ({
  useCategories: (type?: "income" | "expense") => ({
    data: type === "income" ? mockIncomeCategories : mockExpenseCategories,
  }),
  useCreateCategory: () => ({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

jest.mock("@/hooks/use-recurring-rules", () => ({
  useRecurringRulesList: () => ({
    data: mockRecurring,
  }),
}));

jest.mock("@/hooks/use-transactions", () => ({
  useTransactions: () => ({
    data: mockTransactions,
  }),
}));

jest.mock("@/components/settings/account-row", () => ({
  AccountRow: ({ account }: { account: { name: string } }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `account:${account.name}`);
  },
}));

jest.mock("@/components/settings/category-row", () => ({
  CategoryRow: ({ category }: { category: { name: string } }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `category:${category.name}`);
  },
}));

jest.mock("@/components/settings/dev-tools-section", () => ({
  DevToolsSection: () => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, "dev-tools");
  },
}));

jest.mock("@/components/settings/update-section", () => ({
  UpdateSection: () => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, "software-update");
  },
}));

describe("app/settings", () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  beforeEach(() => {
    mockCohereLedgerCache.mockReset().mockResolvedValue(undefined);
    mockDelete.mockClear();
    mockReplace.mockReset();
    insertBuilder.values.mockClear();
    insertBuilder.onConflictDoUpdate.mockClear();
    insertBuilder.run.mockClear();
    mockUseDatabase.mockReturnValue({
      delete: mockDelete,
      update: jest.fn(() => updateBuilder),
      insert: jest.fn(() => insertBuilder),
    });
  });

  it("renders settings content and dev tools", async () => {
    await render(
      <QueryClientProvider client={client}>
        <SettingsScreen />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Manage 🛠️")).toBeOnTheScreen();
    expect(screen.getByText("1 account")).toBeOnTheScreen();
    expect(screen.getByText("Categories")).toBeOnTheScreen();
    expect(screen.getByText("Recurring Rules")).toBeOnTheScreen();
    expect(screen.getByText("software-update")).toBeOnTheScreen();
    expect(screen.getByText("dev-tools")).toBeOnTheScreen();
  });

  it("reports a full reset after erasing data and waits before navigating", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    let resolveCoherence: (() => void) | undefined;
    mockCohereLedgerCache.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveCoherence = resolve;
      }),
    );

    await render(
      <QueryClientProvider client={client}>
        <SettingsScreen />
      </QueryClientProvider>,
    );

    await fireEvent.press(screen.getByText("Erase All Data"));

    const destructiveAction = alertSpy.mock.calls[0]?.[2]?.[1];
    let erasePromise: Promise<void> | void | undefined;
    await act(async () => {
      erasePromise = destructiveAction?.onPress?.();
    });

    await waitFor(() => {
      expect(mockCohereLedgerCache).toHaveBeenCalledWith(expect.anything(), {
        kind: "ledger.reset",
      });
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(insertBuilder.run).toHaveBeenCalled();
    expect(insertBuilder.run.mock.invocationCallOrder[0]).toBeLessThan(
      mockCohereLedgerCache.mock.invocationCallOrder[0]!,
    );
    expect(mockReplace).not.toHaveBeenCalled();

    resolveCoherence?.();
    await act(async () => {
      await erasePromise;
    });

    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });
});
