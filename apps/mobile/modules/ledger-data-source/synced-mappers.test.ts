import { describe, expect, it } from "@jest/globals";

import type { Account } from "@/types";

import { calculateSyncedBalance, type SyncedTransaction } from "./synced-mappers";

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
