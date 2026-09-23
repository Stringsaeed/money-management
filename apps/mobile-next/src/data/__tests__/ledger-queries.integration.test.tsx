import type { PropsWithChildren } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  V2Account,
  V2Category,
  V2Home,
  V2LedgerScope,
  V2RecurringRule,
  V2Transaction,
} from "@trove/api/v2/contracts";

import {
  LedgerDataProvider,
  useAccountsQuery,
  useCategoriesQuery,
  useHomeQuery,
  useLedgerMutations,
  useRecurringQuery,
  useTransactionsQuery,
} from "@/data/ledger-queries";
import { ledgerClient } from "@/data/ledger-client";

const PERSONAL_SCOPE: V2LedgerScope = { kind: "personal" };
const HOUSEHOLD_SCOPE: V2LedgerScope = { kind: "household", householdId: "household-1" };
const queryClients = new Set<QueryClient>();

const createTestQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  });
  queryClients.add(queryClient);
  return queryClient;
};

const account = (id: string, balanceMinor: number): V2Account => ({
  id,
  ledgerId: "personal:guest-1",
  name: id,
  type: "checking",
  currency: "USD",
  openingBalanceMinor: 0,
  balanceMinor,
  archived: false,
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const category = (id: string): V2Category => ({
  id,
  ledgerId: "personal:guest-1",
  name: id,
  kind: "expense",
  color: "#8B9D83",
  icon: "circle",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const transaction = (id: string, accountId: string, toAccountId: string | null): V2Transaction => ({
  id,
  ledgerId: "personal:guest-1",
  accountId,
  categoryId: null,
  toAccountId,
  kind: toAccountId ? "transfer" : "expense",
  amountMinor: 100,
  currency: "USD",
  date: "2026-09-21",
  note: id,
  recurringRuleId: null,
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const recurring = (id: string): V2RecurringRule => ({
  id,
  ledgerId: "personal:guest-1",
  name: id,
  accountId: "account-1",
  categoryId: null,
  toAccountId: null,
  kind: "expense",
  amountMinor: 100,
  currency: "USD",
  note: id,
  frequency: "month",
  intervalCount: 1,
  startDate: "2026-09-21",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
  lifecycle: "active",
  health: "ready",
  attentionReasons: [],
  eligibilityFloor: "2026-09-21",
  revision: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

interface ScopeData {
  accounts: V2Account[];
  categories: V2Category[];
  transactions: V2Transaction[];
  recurring: V2RecurringRule[];
  home: V2Home;
}

const page = <T,>(items: readonly T[]) => ({ items, nextCursor: null });

const scopeKey = (scope: V2LedgerScope): string =>
  scope.kind === "personal" ? "personal" : `household:${scope.householdId}`;

const createScopeData = (scope: V2LedgerScope): ScopeData => {
  const suffix = scope.kind === "personal" ? "personal" : scope.householdId;
  const accounts = [account(`${suffix}-account`, 1000)];
  const categories = [category(`${suffix}-category`)];
  const transactions = [transaction(`${suffix}-transaction`, accounts[0].id, null)];
  const recurringRules = [recurring(`${suffix}-recurring`)];
  return {
    accounts,
    categories,
    transactions,
    recurring: recurringRules,
    home: {
      ledgerId: `${suffix}-ledger`,
      accounts,
      totals: [{ currency: "USD", incomeMinor: 0, expenseMinor: 100, netMinor: -100 }],
      recentTransactions: transactions,
    },
  };
};

const createWrapper = (queryClient: QueryClient, identityKey: string, scope: V2LedgerScope) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <LedgerDataProvider identityKey={identityKey} queryClient={queryClient} scope={scope}>
        {children}
      </LedgerDataProvider>
    </QueryClientProvider>
  );
  return Wrapper;
};

const useLedgerSnapshot = () => ({
  accounts: useAccountsQuery(),
  categories: useCategoriesQuery(),
  transactions: useTransactionsQuery(),
  recurring: useRecurringQuery(),
  home: useHomeQuery(),
  mutations: useLedgerMutations(),
});

describe("V2 ledger query and mutation integration", () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    for (const queryClient of queryClients) {
      queryClient.clear();
    }
    queryClients.clear();
  });

  it.each([
    ["deleteAccount", "personal-account"],
    ["deleteCategory", "personal-category"],
  ] as const)("refreshes every scoped collection and Home after %s", async (operation, id) => {
    const queryClient = createTestQueryClient();
    const states = new Map<string, ScopeData>([
      [scopeKey(PERSONAL_SCOPE), createScopeData(PERSONAL_SCOPE)],
      [scopeKey(HOUSEHOLD_SCOPE), createScopeData(HOUSEHOLD_SCOPE)],
    ]);
    const listCalls = new Map<string, number>();
    const homeCalls = new Map<string, number>();
    const countList = (name: string, scope: V2LedgerScope) => {
      const key = `${name}:${scopeKey(scope)}`;
      listCalls.set(key, (listCalls.get(key) ?? 0) + 1);
    };
    const stateFor = (scope: V2LedgerScope) => {
      const state = states.get(scopeKey(scope));
      if (!state) throw new Error(`Missing fixture for ${scopeKey(scope)}`);
      return state;
    };

    jest.spyOn(ledgerClient.accounts, "list").mockImplementation(async (scope) => {
      countList("accounts", scope);
      return page(stateFor(scope).accounts);
    });
    jest.spyOn(ledgerClient.categories, "list").mockImplementation(async (scope) => {
      countList("categories", scope);
      return page(stateFor(scope).categories);
    });
    jest.spyOn(ledgerClient.transactions, "list").mockImplementation(async (scope) => {
      countList("transactions", scope);
      return page(stateFor(scope).transactions);
    });
    jest.spyOn(ledgerClient.recurring, "list").mockImplementation(async (scope) => {
      countList("recurring", scope);
      return page(stateFor(scope).recurring);
    });
    jest.spyOn(ledgerClient, "home").mockImplementation(async (scope) => {
      const key = scopeKey(scope);
      homeCalls.set(key, (homeCalls.get(key) ?? 0) + 1);
      return stateFor(scope).home;
    });

    const removeClient =
      operation === "deleteAccount" ? ledgerClient.accounts : ledgerClient.categories;
    jest
      .spyOn(removeClient, "remove")
      .mockImplementation(
        async (
          scope: V2LedgerScope,
          deletedId: string,
          _version?: number,
          _requestKey?: string,
        ) => {
          const state = stateFor(scope);
          state.accounts = operation === "deleteAccount" ? [] : [account("personal-account", 900)];
          state.categories = operation === "deleteCategory" ? [] : [category("personal-category")];
          state.transactions = [];
          state.recurring = [];
          state.home = {
            ...state.home,
            accounts: state.accounts,
            totals: [{ currency: "USD", incomeMinor: 0, expenseMinor: 0, netMinor: 0 }],
            recentTransactions: [],
          };
          expect(deletedId).toBe(id);
        },
      );

    const primary = await renderHook(() => useLedgerSnapshot(), {
      wrapper: createWrapper(queryClient, "guest-1", PERSONAL_SCOPE),
    });
    const secondary = await renderHook(() => useLedgerSnapshot(), {
      wrapper: createWrapper(queryClient, "guest-2", HOUSEHOLD_SCOPE),
    });

    await waitFor(() => {
      expect(primary.result.current.accounts.data).toHaveLength(1);
      expect(primary.result.current.categories.data).toHaveLength(1);
      expect(primary.result.current.transactions.data).toHaveLength(1);
      expect(primary.result.current.recurring.data).toHaveLength(1);
      expect(primary.result.current.home.data?.accounts[0]?.balanceMinor).toBe(1000);
      expect(secondary.result.current.accounts.data).toHaveLength(1);
      expect(secondary.result.current.categories.data).toHaveLength(1);
      expect(secondary.result.current.transactions.data).toHaveLength(1);
      expect(secondary.result.current.recurring.data).toHaveLength(1);
      expect(secondary.result.current.home.data?.accounts[0]?.balanceMinor).toBe(1000);
    });

    const initialSecondary = {
      accounts: secondary.result.current.accounts.data,
      categories: secondary.result.current.categories.data,
      transactions: secondary.result.current.transactions.data,
      recurring: secondary.result.current.recurring.data,
      home: secondary.result.current.home.data,
    };
    const initialCalls = new Map(listCalls);
    const initialHomeCalls = new Map(homeCalls);

    await act(async () => {
      await primary.result.current.mutations[operation](id, 1);
    });

    await waitFor(() => {
      expect(primary.result.current.accounts.data).toHaveLength(
        operation === "deleteAccount" ? 0 : 1,
      );
      expect(primary.result.current.categories.data).toHaveLength(
        operation === "deleteCategory" ? 0 : 1,
      );
      expect(primary.result.current.transactions.data).toHaveLength(0);
      expect(primary.result.current.recurring.data).toHaveLength(0);
      expect(primary.result.current.home.data?.totals[0]?.netMinor).toBe(0);
      expect(primary.result.current.home.data?.accounts[0]?.balanceMinor).toBe(
        operation === "deleteAccount" ? undefined : 900,
      );
    });

    for (const collection of ["accounts", "categories", "transactions", "recurring"]) {
      expect(listCalls.get(`${collection}:${scopeKey(PERSONAL_SCOPE)}`)).toBe(
        (initialCalls.get(`${collection}:${scopeKey(PERSONAL_SCOPE)}`) ?? 0) + 1,
      );
      expect(listCalls.get(`${collection}:${scopeKey(HOUSEHOLD_SCOPE)}`)).toBe(
        initialCalls.get(`${collection}:${scopeKey(HOUSEHOLD_SCOPE)}`),
      );
    }
    expect(homeCalls.get(scopeKey(PERSONAL_SCOPE))).toBe(
      (initialHomeCalls.get(scopeKey(PERSONAL_SCOPE)) ?? 0) + 1,
    );
    expect(homeCalls.get(scopeKey(HOUSEHOLD_SCOPE))).toBe(
      initialHomeCalls.get(scopeKey(HOUSEHOLD_SCOPE)),
    );
    expect(primary.result.current.home.data?.recentTransactions).toEqual([]);
    expect(secondary.result.current.accounts.data).toEqual(initialSecondary.accounts);
    expect(secondary.result.current.categories.data).toEqual(initialSecondary.categories);
    expect(secondary.result.current.transactions.data).toEqual(initialSecondary.transactions);
    expect(secondary.result.current.recurring.data).toEqual(initialSecondary.recurring);
    expect(secondary.result.current.home.data).toEqual(initialSecondary.home);
  });

  it("keeps visible rows when DELETE is rejected", async () => {
    const queryClient = createTestQueryClient();
    const state = createScopeData(PERSONAL_SCOPE);
    const listCalls = jest.fn();
    jest.spyOn(ledgerClient.accounts, "list").mockImplementation(async () => {
      listCalls();
      return page(state.accounts);
    });
    jest
      .spyOn(ledgerClient.categories, "list")
      .mockImplementation(async () => page(state.categories));
    jest
      .spyOn(ledgerClient.transactions, "list")
      .mockImplementation(async () => page(state.transactions));
    jest
      .spyOn(ledgerClient.recurring, "list")
      .mockImplementation(async () => page(state.recurring));
    jest.spyOn(ledgerClient, "home").mockImplementation(async () => state.home);
    jest.spyOn(ledgerClient.accounts, "remove").mockRejectedValue(new Error("DELETE rejected"));

    const hook = await renderHook(() => useLedgerSnapshot(), {
      wrapper: createWrapper(queryClient, "guest-1", PERSONAL_SCOPE),
    });
    await waitFor(() => expect(hook.result.current.accounts.data).toHaveLength(1));
    const initialCalls = listCalls.mock.calls.length;

    await expect(
      act(async () => {
        await hook.result.current.mutations.deleteAccount("personal-account", 1);
      }),
    ).rejects.toThrow("DELETE rejected");

    expect(hook.result.current.accounts.data.map((row) => row.id)).toEqual(
      state.accounts.map((row) => row.id),
    );
    expect(hook.result.current.categories.data.map((row) => row.id)).toEqual(
      state.categories.map((row) => row.id),
    );
    expect(hook.result.current.transactions.data.map((row) => row.id)).toEqual(
      state.transactions.map((row) => row.id),
    );
    expect(hook.result.current.recurring.data.map((row) => row.id)).toEqual(
      state.recurring.map((row) => row.id),
    );
    expect(hook.result.current.home.data).toEqual(state.home);
    expect(listCalls).toHaveBeenCalledTimes(initialCalls);
  });

  it("includes transfer rows when filtering by their destination account", async () => {
    const queryClient = createTestQueryClient();
    const state = createScopeData(PERSONAL_SCOPE);
    state.transactions = [transaction("transfer", "source-account", "destination-account")];
    jest.spyOn(ledgerClient.accounts, "list").mockResolvedValue(page(state.accounts));
    jest.spyOn(ledgerClient.categories, "list").mockResolvedValue(page(state.categories));
    jest.spyOn(ledgerClient.transactions, "list").mockResolvedValue(page(state.transactions));
    jest.spyOn(ledgerClient.recurring, "list").mockResolvedValue(page(state.recurring));
    jest.spyOn(ledgerClient, "home").mockResolvedValue(state.home);

    const hook = await renderHook(
      () => useTransactionsQuery({ accountId: "destination-account" }),
      {
        wrapper: createWrapper(queryClient, "guest-1", PERSONAL_SCOPE),
      },
    );

    await waitFor(() => expect(hook.result.current.data).toHaveLength(1));
    expect(hook.result.current.data[0]?.id).toBe("transfer");
  });
});
