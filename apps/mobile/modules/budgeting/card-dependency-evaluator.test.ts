import { describe, expect, it } from "@jest/globals";

import type { AccountDependencyFacts } from "./account-dependency-read";
import { evaluateCardBudgetState } from "./card-dependency-evaluator";

const baseFacts = (): AccountDependencyFacts => ({
  accounts: [
    {
      currency: "USD",
      id: "account-main",
      initialBalance: 0,
      type: "checking",
    },
  ],
  activationPeriod: "2026-08",
  assignments: [],
  memberships: [],
  rollovers: [],
  transactions: [],
});

describe("card dependency evaluator validation", () => {
  it("refuses unsupported Transaction discriminants", () => {
    const facts = baseFacts();
    facts.transactions.push({
      accountId: "account-main",
      amountMinor: 100,
      currency: "USD",
      date: "2026-08-10",
      destinationCurrency: null,
      envelopeId: null,
      id: "transaction-corrupt",
      sourceCurrency: "USD",
      toAccountId: null,
      type: "refund" as never,
    });

    expect(() => evaluateCardBudgetState(facts, "2026-08")).toThrow(
      "Unsupported Transaction type in budget history: refund.",
    );
  });

  it("refuses unsafe minor-unit facts", () => {
    const facts = baseFacts();
    facts.accounts[0]!.initialBalance = Number.MAX_SAFE_INTEGER + 1;

    expect(() => evaluateCardBudgetState(facts, "2026-08")).toThrow(
      "USD Money must use safe integer minor units.",
    );
  });
});
