import { describe, expect, it } from "@jest/globals";

import type { Account } from "@/types";

import {
  assertSupportedAccountUpdate,
  assertSupportedTransactionUpdate,
  calculateSyncedBalance,
  mapSyncedAccount,
  mapSyncedCategory,
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
