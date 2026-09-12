import { describe, expect, it } from "@jest/globals";

import type { Account, Category } from "@/types";
import type {
  PowerSyncAccountRow,
  PowerSyncCategoryRow,
  PowerSyncTransactionRow,
} from "@/modules/ledger-db/types";

import {
  assertSupportedAccountUpdate,
  assertSupportedTransactionUpdate,
  calculateSyncedBalance,
  mapPowerSyncAccount,
  mapPowerSyncCategory,
  mapPowerSyncTransaction,
  mapSyncedAccount,
  mapSyncedCategory,
  mapSyncedTransaction,
  type SyncedAccount,
  type SyncedCategory,
  type SyncedTransaction,
} from "./synced-mappers";

const TIMESTAMP = "2026-01-01T00:00:00.000Z";

const account = (overrides: Partial<Account> = {}): Account => ({
  id: "acct-a",
  name: "Checking",
  type: "checking",
  currency: "USD",
  color: "#000000",
  icon: "banknote.fill",
  initialBalance: 1000,
  excludeFromTotal: false,
  sortOrder: 0,
  lifecycle: "active",
  lifecycleChangedAt: null,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
});

const tx = (overrides: Partial<SyncedTransaction>): SyncedTransaction => ({
  id: "tx-1",
  ledgerId: "led-1",
  householdId: "hh-1",
  type: "expense",
  amountMinor: 100,
  currency: "USD",
  originalAmountMinor: null,
  originalCurrency: null,
  exchangeRate: null,
  date: "2026-01-02",
  accountId: "acct-a",
  toAccountId: null,
  categoryId: "cat-1",
  isRecurring: false,
  recurringRuleId: null,
  description: "",
  version: 1,
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
});

describe("calculateSyncedBalance", () => {
  it("increases from initialBalance for income on the account", () => {
    expect(
      calculateSyncedBalance(account({ initialBalance: 1000 }), [
        tx({ id: "in-1", type: "income", amountMinor: 250, accountId: "acct-a" }),
      ]),
    ).toBe(1250);
  });

  it("decreases for expense on the account", () => {
    expect(
      calculateSyncedBalance(account({ initialBalance: 1000 }), [
        tx({ id: "ex-1", type: "expense", amountMinor: 400, accountId: "acct-a" }),
      ]),
    ).toBe(600);
  });

  it("increases for transfer into the account via toAccountId", () => {
    expect(
      calculateSyncedBalance(account({ initialBalance: 1000 }), [
        tx({
          id: "tr-in",
          type: "transfer",
          amountMinor: 300,
          accountId: "acct-b",
          toAccountId: "acct-a",
        }),
      ]),
    ).toBe(1300);
  });

  it("ignores transactions that do not touch the account", () => {
    expect(
      calculateSyncedBalance(account({ initialBalance: 1000 }), [
        tx({
          id: "other-ex",
          type: "expense",
          amountMinor: 999,
          accountId: "acct-other",
          toAccountId: null,
        }),
        tx({
          id: "other-tr",
          type: "transfer",
          amountMinor: 500,
          accountId: "acct-x",
          toAccountId: "acct-y",
        }),
      ]),
    ).toBe(1000);
  });
});

describe("assertSupportedAccountUpdate", () => {
  it("allows name, color, icon, excludeFromTotal, and sortOrder edits", () => {
    expect(() =>
      assertSupportedAccountUpdate({
        name: "Renamed",
        color: "#111111",
        icon: "wallet.fill",
        excludeFromTotal: true,
        sortOrder: 2,
      }),
    ).not.toThrow();
  });

  it("rejects type edits", () => {
    expect(() => assertSupportedAccountUpdate({ type: "cash" })).toThrow(
      /Account type, currency, or opening balance edit is unavailable for the synced ledger/,
    );
  });

  it("rejects currency edits", () => {
    expect(() => assertSupportedAccountUpdate({ currency: "EUR" })).toThrow(
      /Those fields remain unchanged/,
    );
  });

  it("rejects initialBalance edits", () => {
    expect(() => assertSupportedAccountUpdate({ initialBalance: 0 })).toThrow(
      /Edit only the Account name, color, icon, exclude-from-total flag, or sort order/,
    );
  });
});

describe("assertSupportedTransactionUpdate", () => {
  it("allows type, amount, date, account, category, and description edits", () => {
    expect(() =>
      assertSupportedTransactionUpdate({
        type: "expense",
        amount: 4200,
        date: "2026-09-12",
        accountId: "acct-a",
        categoryId: "cat-1",
        description: "Coffee",
      }),
    ).not.toThrow();
  });

  it("rejects currency edits", () => {
    expect(() => assertSupportedTransactionUpdate({ currency: "EUR" })).toThrow(
      /This Transaction edit is unavailable for the synced ledger/,
    );
  });

  it("rejects original amount/currency and exchangeRate edits", () => {
    expect(() => assertSupportedTransactionUpdate({ originalAmount: 100 })).toThrow(
      /Unsupported fields remain unchanged/,
    );
    expect(() => assertSupportedTransactionUpdate({ originalCurrency: "JPY" })).toThrow(
      /Unsupported fields remain unchanged/,
    );
    expect(() => assertSupportedTransactionUpdate({ exchangeRate: 1084700 })).toThrow(
      /Unsupported fields remain unchanged/,
    );
  });

  it("rejects recurring lineage edits", () => {
    expect(() => assertSupportedTransactionUpdate({ isRecurring: true })).toThrow(
      /Edit only type, amount, date, Account, Category, or description/,
    );
    expect(() => assertSupportedTransactionUpdate({ recurringRuleId: "rule-1" })).toThrow(
      /Edit only type, amount, date, Account, Category, or description/,
    );
  });
});

const syncedAccount = (overrides: Record<string, unknown> = {}): SyncedAccount =>
  ({
    id: "acct-a",
    name: "Checking",
    type: "bank",
    currency: "USD",
    color: "#000000",
    icon: "banknote.fill",
    initialBalanceMinor: 2500,
    excludeFromTotal: false,
    sortOrder: 1,
    lifecycle: "active",
    lifecycleChangedAt: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  }) as SyncedAccount;

describe("mapSyncedAccount", () => {
  it("maps bank wire type to checking and initialBalanceMinor to initialBalance", () => {
    expect(mapSyncedAccount(syncedAccount({ type: "bank", initialBalanceMinor: 2500 }))).toEqual(
      expect.objectContaining({
        id: "acct-a",
        name: "Checking",
        type: "checking",
        initialBalance: 2500,
        excludeFromTotal: false,
        sortOrder: 1,
        lifecycleChangedAt: null,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      }),
    );
  });

  it("maps card wire type to credit_card", () => {
    expect(mapSyncedAccount(syncedAccount({ type: "card", name: "Visa" })).type).toBe(
      "credit_card",
    );
  });

  it("maps cash wire type to cash", () => {
    expect(mapSyncedAccount(syncedAccount({ type: "cash" })).type).toBe("cash");
  });

  it("coerces Date timestamps to ISO strings", () => {
    const created = new Date("2026-02-01T12:00:00.000Z");
    const changed = new Date("2026-03-01T08:30:00.000Z");
    const mapped = mapSyncedAccount(
      syncedAccount({
        createdAt: created,
        updatedAt: created,
        lifecycleChangedAt: changed,
      }),
    );
    expect(mapped.createdAt).toBe("2026-02-01T12:00:00.000Z");
    expect(mapped.updatedAt).toBe("2026-02-01T12:00:00.000Z");
    expect(mapped.lifecycleChangedAt).toBe("2026-03-01T08:30:00.000Z");
  });
});

const syncedCategory = (overrides: Record<string, unknown> = {}): SyncedCategory =>
  ({
    id: "cat-1",
    name: "Groceries",
    type: "expense",
    color: "#B48A7B",
    icon: "🛒",
    parentId: null,
    sortOrder: 3,
    lifecycle: "active",
    lifecycleChangedAt: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  }) as SyncedCategory;

describe("mapSyncedCategory", () => {
  it("copies wire category fields onto the domain Category", () => {
    expect(mapSyncedCategory(syncedCategory())).toEqual(
      expect.objectContaining({
        id: "cat-1",
        name: "Groceries",
        type: "expense",
        color: "#B48A7B",
        icon: "🛒",
        parentId: null,
        sortOrder: 3,
        lifecycle: "active",
        lifecycleChangedAt: null,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      }),
    );
  });

  it("preserves parentId for nested categories", () => {
    expect(mapSyncedCategory(syncedCategory({ parentId: "cat-parent", type: "income" }))).toEqual(
      expect.objectContaining({
        parentId: "cat-parent",
        type: "income",
      }),
    );
  });

  it("coerces Date timestamps to ISO strings", () => {
    const created = new Date("2026-04-01T09:00:00.000Z");
    const changed = new Date("2026-05-01T10:00:00.000Z");
    const mapped = mapSyncedCategory(
      syncedCategory({
        createdAt: created,
        updatedAt: created,
        lifecycleChangedAt: changed,
      }),
    );
    expect(mapped.createdAt).toBe("2026-04-01T09:00:00.000Z");
    expect(mapped.updatedAt).toBe("2026-04-01T09:00:00.000Z");
    expect(mapped.lifecycleChangedAt).toBe("2026-05-01T10:00:00.000Z");
  });

  it("keeps null lifecycleChangedAt when unset", () => {
    expect(mapSyncedCategory(syncedCategory({ lifecycleChangedAt: null })).lifecycleChangedAt).toBeNull();
  });
});

const category = (overrides: Partial<Category> = {}): Category => ({
  id: "cat-1",
  name: "Groceries",
  type: "expense",
  color: "#B48A7B",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  lifecycle: "active",
  lifecycleChangedAt: null,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
});

describe("mapSyncedTransaction", () => {
  it("maps amountMinor and joins matching account and category", () => {
    const mapped = mapSyncedTransaction(
      tx({
        type: "expense",
        amountMinor: 4200,
        accountId: "acct-a",
        categoryId: "cat-1",
        description: "Market",
      }),
      [account()],
      [category()],
    );
    expect(mapped).toEqual(
      expect.objectContaining({
        amount: 4200,
        type: "expense",
        accountId: "acct-a",
        categoryId: "cat-1",
        description: "Market",
        account: {
          id: "acct-a",
          name: "Checking",
          color: "#000000",
          icon: "banknote.fill",
          currency: "USD",
        },
        category: { id: "cat-1", name: "Groceries", color: "#B48A7B", icon: "🛒" },
        toAccount: null,
      }),
    );
  });

  it("uses Unknown account fallback when accountId is missing from the list", () => {
    const mapped = mapSyncedTransaction(
      tx({ accountId: "acct-missing", currency: "EUR" }),
      [account()],
      [category()],
    );
    expect(mapped.account).toEqual({
      id: "acct-missing",
      name: "Unknown",
      color: "#ccc",
      icon: "banknote.fill",
      currency: "EUR",
    });
  });

  it("resolves toAccount for transfers and null category when unmatched", () => {
    const mapped = mapSyncedTransaction(
      tx({
        type: "transfer",
        accountId: "acct-a",
        toAccountId: "acct-b",
        categoryId: "cat-missing",
      }),
      [account(), account({ id: "acct-b", name: "Savings", color: "#111111", icon: "tray.fill" })],
      [category()],
    );
    expect(mapped.toAccount).toEqual({
      id: "acct-b",
      name: "Savings",
      color: "#111111",
      icon: "tray.fill",
      currency: "USD",
    });
    expect(mapped.category).toBeNull();
  });

  it("coerces Date timestamps to ISO strings", () => {
    const created = new Date("2026-06-01T11:00:00.000Z");
    const mapped = mapSyncedTransaction(
      tx({ createdAt: created, updatedAt: created }),
      [account()],
      [category()],
    );
    expect(mapped.createdAt).toBe("2026-06-01T11:00:00.000Z");
    expect(mapped.updatedAt).toBe("2026-06-01T11:00:00.000Z");
  });
});

const powerSyncAccount = (overrides: Partial<PowerSyncAccountRow> = {}): PowerSyncAccountRow => ({
  id: "ps-acct-a",
  ledger_id: "led-1",
  household_id: "hh-1",
  name: "Checking",
  type: "bank",
  currency: "USD",
  color: "#000000",
  icon: "banknote.fill",
  initial_balance_minor: 2500,
  exclude_from_total: 0,
  sort_order: 1,
  lifecycle: "active",
  lifecycle_changed_at: null,
  owner_user_id: "user-1",
  version: 1,
  created_by: "user-1",
  updated_by: "user-1",
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  ...overrides,
});

describe("mapPowerSyncAccount", () => {
  it("maps bank row type to checking and snake_case balance fields", () => {
    expect(mapPowerSyncAccount(powerSyncAccount({ type: "bank", initial_balance_minor: 2500 }))).toEqual(
      expect.objectContaining({
        id: "ps-acct-a",
        name: "Checking",
        type: "checking",
        initialBalance: 2500,
        excludeFromTotal: false,
        sortOrder: 1,
        lifecycleChangedAt: null,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      }),
    );
  });

  it("maps card row type to credit_card", () => {
    expect(mapPowerSyncAccount(powerSyncAccount({ type: "card", name: "Visa" })).type).toBe(
      "credit_card",
    );
  });

  it("maps cash row type to cash", () => {
    expect(mapPowerSyncAccount(powerSyncAccount({ type: "cash" })).type).toBe("cash");
  });

  it("treats exclude_from_total=1 as excludeFromTotal true", () => {
    expect(
      mapPowerSyncAccount(powerSyncAccount({ exclude_from_total: 1 })).excludeFromTotal,
    ).toBe(true);
  });
});

const powerSyncCategory = (
  overrides: Partial<PowerSyncCategoryRow> = {},
): PowerSyncCategoryRow => ({
  id: "ps-cat-1",
  ledger_id: "led-1",
  household_id: "hh-1",
  name: "Groceries",
  type: "expense",
  color: "#B48A7B",
  icon: "🛒",
  parent_id: null,
  sort_order: 3,
  lifecycle: "active",
  lifecycle_changed_at: null,
  version: 1,
  created_by: "user-1",
  updated_by: "user-1",
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  ...overrides,
});

describe("mapPowerSyncCategory", () => {
  it("maps snake_case row fields onto the domain Category", () => {
    expect(mapPowerSyncCategory(powerSyncCategory())).toEqual(
      expect.objectContaining({
        id: "ps-cat-1",
        name: "Groceries",
        type: "expense",
        color: "#B48A7B",
        icon: "🛒",
        parentId: null,
        sortOrder: 3,
        lifecycle: "active",
        lifecycleChangedAt: null,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      }),
    );
  });

  it("preserves parent_id as parentId for nested categories", () => {
    expect(
      mapPowerSyncCategory(powerSyncCategory({ parent_id: "ps-cat-parent", type: "income" })),
    ).toEqual(
      expect.objectContaining({
        parentId: "ps-cat-parent",
        type: "income",
      }),
    );
  });

  it("passes through lifecycle_changed_at timestamps", () => {
    expect(
      mapPowerSyncCategory(
        powerSyncCategory({ lifecycle_changed_at: "2026-07-01T12:00:00.000Z" }),
      ).lifecycleChangedAt,
    ).toBe("2026-07-01T12:00:00.000Z");
  });

  it("keeps null lifecycle_changed_at when unset", () => {
    expect(
      mapPowerSyncCategory(powerSyncCategory({ lifecycle_changed_at: null })).lifecycleChangedAt,
    ).toBeNull();
  });
});

const powerSyncTransaction = (
  overrides: Partial<PowerSyncTransactionRow> = {},
): PowerSyncTransactionRow => ({
  id: "ps-tx-1",
  ledger_id: "led-1",
  household_id: "hh-1",
  type: "expense",
  amount_minor: 4200,
  currency: "USD",
  original_amount_minor: null,
  original_currency: null,
  exchange_rate: null,
  date: "2026-09-12",
  account_id: "acct-a",
  to_account_id: null,
  category_id: "cat-1",
  is_recurring: 0,
  recurring_rule_id: null,
  description: "Market",
  version: 1,
  created_by: "user-1",
  updated_by: "user-1",
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  ...overrides,
});

describe("mapPowerSyncTransaction", () => {
  it("maps snake_case row fields onto SyncedTransaction", () => {
    expect(mapPowerSyncTransaction(powerSyncTransaction())).toEqual(
      expect.objectContaining({
        id: "ps-tx-1",
        ledgerId: "led-1",
        householdId: "hh-1",
        type: "expense",
        amountMinor: 4200,
        currency: "USD",
        originalAmountMinor: null,
        originalCurrency: null,
        exchangeRate: null,
        date: "2026-09-12",
        accountId: "acct-a",
        toAccountId: null,
        categoryId: "cat-1",
        isRecurring: false,
        recurringRuleId: null,
        description: "Market",
        version: 1,
        createdBy: "user-1",
        updatedBy: "user-1",
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      }),
    );
  });

  it("treats is_recurring=1 as isRecurring true and keeps recurring_rule_id", () => {
    expect(
      mapPowerSyncTransaction(
        powerSyncTransaction({ is_recurring: 1, recurring_rule_id: "rule-9" }),
      ),
    ).toEqual(
      expect.objectContaining({
        isRecurring: true,
        recurringRuleId: "rule-9",
      }),
    );
  });

  it("maps transfer to_account_id onto toAccountId", () => {
    expect(
      mapPowerSyncTransaction(
        powerSyncTransaction({
          type: "transfer",
          to_account_id: "acct-b",
          category_id: null,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        type: "transfer",
        toAccountId: "acct-b",
        categoryId: null,
      }),
    );
  });

  it("maps FX fields when present", () => {
    expect(
      mapPowerSyncTransaction(
        powerSyncTransaction({
          original_amount_minor: 5000,
          original_currency: "EUR",
          exchange_rate: 1084700,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        originalAmountMinor: 5000,
        originalCurrency: "EUR",
        exchangeRate: 1084700,
      }),
    );
  });
});
