import { describe, expect, it } from "@jest/globals";

import type {
  AccountDependencyFacts,
  BudgetTransactionRow,
} from "./account-dependency-read";
import {
  applyBudgetTransaction,
  applyLedgerBalance,
} from "./card-dependency-transactions";

const row = (overrides: Partial<BudgetTransactionRow>): BudgetTransactionRow => ({
  id: "txn-1",
  accountId: "account-1",
  amountMinor: 25_00,
  currency: "USD",
  date: "2026-03-28",
  destinationCurrency: null,
  envelopeId: null,
  sourceCurrency: "USD",
  toAccountId: null,
  type: "expense",
  ...overrides,
});

const emptyFacts = (
  memberships: AccountDependencyFacts["memberships"] = [],
): AccountDependencyFacts => ({
  accounts: [],
  activationPeriod: "2026-01",
  assignments: [],
  memberships,
  rollovers: [],
  transactions: [],
});

describe("applyLedgerBalance", () => {
  it("credits income and debits expense on the source account", () => {
    const balances = new Map<string, number>([["account-1", 100_00]]);

    applyLedgerBalance(row({ type: "income", amountMinor: 40_00 }), balances);
    expect(balances.get("account-1")).toBe(140_00);

    applyLedgerBalance(row({ type: "expense", amountMinor: 15_00 }), balances);
    expect(balances.get("account-1")).toBe(125_00);
  });

  it("moves transfer amounts from source to destination account", () => {
    const balances = new Map<string, number>([
      ["account-1", 100_00],
      ["account-2", 10_00],
    ]);

    applyLedgerBalance(
      row({
        type: "transfer",
        amountMinor: 30_00,
        toAccountId: "account-2",
        destinationCurrency: "USD",
      }),
      balances,
    );

    expect(balances.get("account-1")).toBe(70_00);
    expect(balances.get("account-2")).toBe(40_00);
  });
});

describe("applyBudgetTransaction", () => {
  it("debits cash expense against balance and funded Envelope availability", () => {
    const balances = new Map<string, number>([["checking", 200_00]]);
    const availability = new Map<string, number>([["groceries", 80_00]]);
    const reserveByAccount = new Map<string, number>();
    const unreservedPaymentByAccount = new Map<string, number>();
    const unfunded: { accountId: string; envelopeId: string; remainingMinor: number }[] = [];
    const accountTypes = new Map<string, string>([["checking", "checking"]]);
    const facts = emptyFacts([
      {
        accountId: "checking",
        currency: "USD",
        effectiveFromPeriod: "2026-01",
        effectiveToPeriod: null,
      },
    ]);

    applyBudgetTransaction(
      row({
        accountId: "checking",
        amountMinor: 30_00,
        envelopeId: "groceries",
        type: "expense",
      }),
      "2026-03",
      facts,
      accountTypes,
      balances,
      availability,
      reserveByAccount,
      unreservedPaymentByAccount,
      unfunded,
    );

    expect(balances.get("checking")).toBe(170_00);
    expect(availability.get("groceries")).toBe(50_00);
    expect(unfunded).toEqual([]);
  });

  it("records unfunded remainder when card expense exceeds Envelope availability", () => {
    const balances = new Map<string, number>([["card-1", 0]]);
    const availability = new Map<string, number>([["travel", 10_00]]);
    const reserveByAccount = new Map<string, number>();
    const unreservedPaymentByAccount = new Map<string, number>();
    const unfunded: { accountId: string; envelopeId: string; remainingMinor: number }[] = [];
    const accountTypes = new Map<string, string>([["card-1", "credit_card"]]);

    applyBudgetTransaction(
      row({
        accountId: "card-1",
        amountMinor: 40_00,
        envelopeId: "travel",
        type: "expense",
      }),
      "2026-03",
      emptyFacts(),
      accountTypes,
      balances,
      availability,
      reserveByAccount,
      unreservedPaymentByAccount,
      unfunded,
    );

    expect(balances.get("card-1")).toBe(-40_00);
    expect(availability.get("travel")).toBe(0);
    expect(reserveByAccount.get("card-1")).toBe(10_00);
    expect(unfunded).toEqual([
      { accountId: "card-1", envelopeId: "travel", remainingMinor: 30_00 },
    ]);
  });
});
