import { describe, expect, it } from "@jest/globals";

import type { BudgetTransactionRow } from "./account-dependency-read";
import { applyLedgerBalance } from "./card-dependency-transactions";

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
