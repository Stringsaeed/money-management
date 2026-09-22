import { describe, expect, it } from "@jest/globals";
import type { V2Account, V2Transaction } from "@trove/api/v2/contracts";

import { buildHomeOverview } from "../home-model";

const NOW = new Date("2026-09-15T12:00:00.000Z");

const account = (
  id: string,
  openingBalanceMinor: number,
  options: Partial<Pick<V2Account, "currency" | "archived">> = {},
): V2Account => ({
  id,
  ledgerId: "ledger-1",
  name: id,
  type: "checking",
  currency: options.currency ?? "USD",
  openingBalanceMinor,
  balanceMinor: openingBalanceMinor,
  archived: options.archived ?? false,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const transaction = (
  id: string,
  date: string,
  accountId: string,
  kind: V2Transaction["kind"],
  amountMinor: number,
  toAccountId: string | null = null,
  currency = "USD",
  recurringRuleId: string | null = null,
): V2Transaction => ({
  id,
  ledgerId: "ledger-1",
  accountId,
  categoryId: null,
  toAccountId,
  kind,
  amountMinor,
  currency,
  date,
  note: id,
  recurringRuleId,
  version: 1,
  createdAt: `${date}T00:00:00.000Z`,
  updatedAt: `${date}T00:00:00.000Z`,
});

describe("buildHomeOverview", () => {
  it("replays opening balance and history while excluding future rows", () => {
    const result = buildHomeOverview({
      accounts: [
        account("main", 1_000),
        account("archived", 9_999, { archived: true }),
        account("eur", 700, { currency: "EUR" }),
      ],
      transactions: [
        transaction("history", "2026-08-31", "main", "income", 500),
        transaction("first", "2026-09-01", "main", "expense", 100),
        transaction("second", "2026-09-02", "main", "income", 200),
        transaction("today", "2026-09-15", "main", "expense", 50),
        transaction("future", "2026-09-16", "main", "income", 999),
        transaction("other-currency", "2026-09-10", "eur", "income", 900, null, "EUR"),
      ],
      currency: "USD",
      range: "month",
      now: NOW,
    });

    expect(result).toMatchObject({
      balanceMinor: 1_550,
      incomeMinor: 200,
      expenseMinor: 150,
      currency: "USD",
      startDate: "2026-09-01",
      endDate: "2026-09-15",
    });
    expect(result.points).toHaveLength(15);
    expect(result.points[0]).toEqual({
      date: "2026-09-01",
      balanceMinor: 1_400,
      incomeMinor: 0,
      expenseMinor: 100,
    });
    expect(result.points[1]).toEqual({
      date: "2026-09-02",
      balanceMinor: 1_600,
      incomeMinor: 200,
      expenseMinor: 0,
    });
    expect(result.points.at(-1)).toEqual({
      date: "2026-09-15",
      balanceMinor: 1_550,
      incomeMinor: 0,
      expenseMinor: 50,
    });
  });

  it("scopes transfers to one account and cancels internal transfers in the aggregate", () => {
    const accounts = [account("source", 1_000), account("destination", 500)];
    const transactions = [
      transaction("transfer", "2026-09-10", "source", "transfer", 200, "destination"),
      transaction("income", "2026-09-11", "destination", "income", 100),
      transaction("expense", "2026-09-12", "source", "expense", 50),
    ];

    const aggregate = buildHomeOverview({
      accounts,
      transactions,
      currency: "USD",
      range: "month",
      now: NOW,
    });
    expect(aggregate.balanceMinor).toBe(1_550);
    expect(aggregate.incomeMinor).toBe(100);
    expect(aggregate.expenseMinor).toBe(50);
    expect(aggregate.points[9]?.balanceMinor).toBe(1_500);

    const source = buildHomeOverview({
      accounts,
      transactions,
      currency: "USD",
      range: "month",
      now: NOW,
      accountId: "source",
    });
    expect(source).toMatchObject({ balanceMinor: 750, incomeMinor: 0, expenseMinor: 50 });
    expect(source.points[9]?.balanceMinor).toBe(800);

    const destination = buildHomeOverview({
      accounts,
      transactions,
      currency: "USD",
      range: "month",
      now: NOW,
      accountId: "destination",
    });
    expect(destination).toMatchObject({ balanceMinor: 800, incomeMinor: 100, expenseMinor: 0 });
  });

  it("groups a year by month and preserves zero and negative transaction amounts", () => {
    const result = buildHomeOverview({
      accounts: [account("main", 0)],
      transactions: [
        transaction("jan-income", "2026-01-01", "main", "income", 100),
        transaction("jan-expense", "2026-01-31", "main", "expense", 20),
        transaction("feb-negative", "2026-02-01", "main", "expense", -30),
        transaction("zero", "2026-03-01", "main", "income", 0),
        transaction("future", "2026-10-01", "main", "income", 900),
      ],
      currency: "USD",
      range: "year",
      now: NOW,
    });

    expect(result).toMatchObject({ balanceMinor: 110, incomeMinor: 100, expenseMinor: -10 });
    expect(result.points).toHaveLength(9);
    expect(result.points[0]).toEqual({
      date: "2026-01-01",
      balanceMinor: 80,
      incomeMinor: 100,
      expenseMinor: 20,
    });
    expect(result.points[1]).toEqual({
      date: "2026-02-01",
      balanceMinor: 110,
      incomeMinor: 0,
      expenseMinor: -30,
    });
  });

  it("rejects an unsafe aggregate instead of returning an imprecise balance", () => {
    expect(() =>
      buildHomeOverview({
        accounts: [account("main", Number.MAX_SAFE_INTEGER)],
        transactions: [transaction("overflow", "2026-09-15", "main", "income", 1)],
        currency: "USD",
        range: "month",
        now: NOW,
      }),
    ).toThrow("USD Home overview exceeds safe integer minor units.");
  });
});
