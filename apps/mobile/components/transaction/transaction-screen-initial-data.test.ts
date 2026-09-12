import { describe, expect, it } from "@jest/globals";

import type { RecurringRule } from "@/modules/recurring-rules";
import type { Transaction } from "@/types";

import { getTransactionScreenInitialData } from "./transaction-screen-initial-data";

const rule = (overrides: Partial<RecurringRule> = {}): RecurringRule =>
  ({
    id: "rule_1",
    name: "Rent",
    type: "expense",
    amountMinor: 12500,
    currency: "USD",
    accountId: "acct_1",
    toAccountId: null,
    categoryId: "cat_1",
    description: "Monthly rent",
    frequency: "month",
    intervalCount: 1,
    startDate: "2026-03-15",
    endDate: "2026-12-01",
    endCount: null,
    timeZone: "America/New_York",
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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }) as RecurringRule;

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "txn_1",
  type: "expense",
  amount: 4200,
  currency: "USD",
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  date: "2026-04-02",
  accountId: "acct_2",
  toAccountId: null,
  categoryId: "cat_2",
  isRecurring: false,
  description: "Coffee",
  recurringRuleId: null,
  createdAt: "2026-04-02T12:00:00.000Z",
  updatedAt: "2026-04-02T12:00:00.000Z",
  ...overrides,
});

const localYmd = (date: Date) => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

describe("getTransactionScreenInitialData", () => {
  it("maps a recurring rule (preferring it over a transaction) into form data", () => {
    const result = getTransactionScreenInitialData(rule(), transaction());

    expect(result).toMatchObject({
      type: "expense",
      amount: 12500,
      accountId: "acct_1",
      toAccountId: null,
      categoryId: "cat_1",
      isRecurring: true,
      description: "Monthly rent",
      currency: "USD",
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      recurrence: {
        frequency: "month",
        intervalCount: 1,
        endCount: null,
      },
    });
    expect(localYmd(result!.date!)).toEqual({ year: 2026, month: 3, day: 15 });
    expect(localYmd(result!.recurrence!.endDate!)).toEqual({ year: 2026, month: 12, day: 1 });

    const sparse = getTransactionScreenInitialData(
      rule({ amountMinor: null, accountId: null, endDate: null, endCount: 6 }),
      undefined,
    );
    expect(sparse).toMatchObject({
      amount: 0,
      accountId: undefined,
      recurrence: { endDate: null, endCount: 6 },
    });
  });

  it("maps a transaction when no rule is present, else undefined", () => {
    expect(getTransactionScreenInitialData(undefined, undefined)).toBeUndefined();
    expect(getTransactionScreenInitialData(null, undefined)).toBeUndefined();

    const result = getTransactionScreenInitialData(undefined, transaction());
    expect(result).toMatchObject({
      type: "expense",
      amount: 4200,
      accountId: "acct_2",
      toAccountId: null,
      categoryId: "cat_2",
      isRecurring: false,
      description: "Coffee",
      currency: "USD",
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
    });
    expect(result?.recurrence).toBeUndefined();
    expect(result!.date).toEqual(new Date("2026-04-02"));
  });
});
