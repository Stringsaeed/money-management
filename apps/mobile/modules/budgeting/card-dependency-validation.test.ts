import { describe, expect, it } from "@jest/globals";

import type { AccountDependencyFacts, BudgetTransactionRow } from "./account-dependency-read";
import {
  addBudgetMoney,
  isUnsupportedCrossCurrencyTransfer,
  unsupportedTransactionType,
  validateAccountDependencyFacts,
} from "./card-dependency-validation";

const baseFacts = (): AccountDependencyFacts => ({
  accounts: [
    { id: "a1", currency: "USD", initialBalance: 100, type: "checking" },
    { id: "a2", currency: "USD", initialBalance: 0, type: "credit_card" },
  ],
  activationPeriod: "2026-09",
  assignments: [{ id: "as1", amountMinor: 50, destinationEnvelopeId: "e1", period: "2026-09", reversesAssignmentId: null, sourceEnvelopeId: null }],
  memberships: [],
  rollovers: [],
  transactions: [
    {
      id: "t1",
      accountId: "a1",
      amountMinor: 25,
      currency: "USD",
      date: "2026-09-01",
      destinationCurrency: null,
      envelopeId: null,
      sourceCurrency: "USD",
      toAccountId: null,
      type: "expense",
    },
  ],
});

describe("addBudgetMoney", () => {
  it("accumulates safe integer minor units by key", () => {
    const totals = new Map<string, number>();
    addBudgetMoney(totals, "a1", 10);
    addBudgetMoney(totals, "a1", 15);
    expect(totals.get("a1")).toBe(25);
  });

  it("rejects non-integer amounts", () => {
    expect(() => addBudgetMoney(new Map(), "a1", 1.5)).toThrow(/safe integer/);
  });
});

describe("validateAccountDependencyFacts", () => {
  it("accepts well-formed account, assignment, and transaction facts", () => {
    expect(() => validateAccountDependencyFacts(baseFacts())).not.toThrow();
  });

  it("rejects unsupported account or transaction types", () => {
    const badAccount = baseFacts();
    badAccount.accounts[0] = { ...badAccount.accounts[0], type: "brokerage" as never };
    expect(() => validateAccountDependencyFacts(badAccount)).toThrow(/Unsupported Account type/);

    const badTxn = baseFacts();
    badTxn.transactions[0] = { ...badTxn.transactions[0], type: "refund" as never };
    expect(() => validateAccountDependencyFacts(badTxn)).toThrow(/Unsupported Transaction type/);
  });
});

describe("isUnsupportedCrossCurrencyTransfer", () => {
  it("flags transfers whose destination currency differs", () => {
    const row: BudgetTransactionRow = {
      id: "t2",
      accountId: "a1",
      amountMinor: 10,
      currency: "USD",
      date: "2026-09-02",
      destinationCurrency: "EUR",
      envelopeId: null,
      sourceCurrency: "USD",
      toAccountId: "a2",
      type: "transfer",
    };
    expect(isUnsupportedCrossCurrencyTransfer(row)).toBe(true);
  });

  it("ignores same-currency transfers and non-transfers", () => {
    const same: BudgetTransactionRow = {
      id: "t3",
      accountId: "a1",
      amountMinor: 10,
      currency: "USD",
      date: "2026-09-02",
      destinationCurrency: "USD",
      envelopeId: null,
      sourceCurrency: "USD",
      toAccountId: "a2",
      type: "transfer",
    };
    expect(isUnsupportedCrossCurrencyTransfer(same)).toBe(false);
    expect(
      isUnsupportedCrossCurrencyTransfer({ ...same, type: "expense", destinationCurrency: null }),
    ).toBe(false);
  });
});

describe("unsupportedTransactionType", () => {
  it("builds a typed error for unknown history rows", () => {
    expect(unsupportedTransactionType("refund")).toEqual(
      expect.objectContaining({ message: expect.stringContaining("refund") }),
    );
  });
});
