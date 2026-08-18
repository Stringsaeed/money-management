import { describe, expect, it } from "@jest/globals";

import type { AccountDependencyFacts } from "./account-dependency-read";
import { sumUnfundedCardSpending } from "./account-dependencies";
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

  it("excludes one-amount cross-currency Transfers from budget replay", () => {
    const facts = baseFacts();
    facts.accounts[0]!.initialBalance = 100_00;
    facts.memberships.push({
      accountId: "account-main",
      currency: "USD",
      effectiveFromPeriod: "2026-08",
      effectiveToPeriod: null,
    });
    facts.transactions.push({
      accountId: "account-main",
      amountMinor: 100_00,
      currency: "USD",
      date: "2026-08-10",
      destinationCurrency: "EUR",
      envelopeId: null,
      id: "transfer-cross-currency",
      sourceCurrency: "USD",
      toAccountId: "account-eur",
      type: "transfer",
    });

    const result = evaluateCardBudgetState(facts, "2026-08");

    expect(result.balances.get("account-main")).toBe(100_00);
    expect(result.balances.has("account-eur")).toBe(false);
  });

  it("refuses an unsafe aggregate of individually safe card deficits", () => {
    const halfSafeMinor = (Number.MAX_SAFE_INTEGER - 1) / 2;

    expect(() =>
      sumUnfundedCardSpending(
        [
          { accountId: "card", envelopeId: "first", remainingMinor: halfSafeMinor },
          { accountId: "card", envelopeId: "second", remainingMinor: halfSafeMinor },
          { accountId: "card", envelopeId: "third", remainingMinor: 2 },
        ],
        "card",
        "USD",
      ),
    ).toThrow("USD Funding Pool exceeds safe integer minor units.");
  });
});
