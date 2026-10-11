import type { V2Account } from "@trove/api/v2/contracts";

import {
  budgetOperation,
  defaultFirstBudgetCurrency,
  dismissCurrencyPrompt,
  EMPTY_BUDGET_CURRENCY_STATE,
  parseBudgetCurrencyState,
  pickBudgetCurrency,
  promptCurrencies,
  serializeBudgetCurrencyState,
} from "../budget-currency";
import { createRequestKeyRunner } from "../request-keys";

const account = (id: string, overrides: Partial<V2Account> = {}): V2Account => ({
  id,
  ledgerId: "ledger",
  name: id,
  type: "checking",
  currency: "AED",
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

describe("pickBudgetCurrency", () => {
  it("keeps the remembered budget while it exists", () => {
    expect(pickBudgetCurrency(["AED", "USD"], "USD")).toBe("USD");
  });

  it("falls back to the first budget when the remembered one is gone or unset", () => {
    expect(pickBudgetCurrency(["AED", "USD"], "SAR")).toBe("AED");
    expect(pickBudgetCurrency(["USD"], null)).toBe("USD");
  });

  it("has no budget to pick when the ledger has none", () => {
    expect(pickBudgetCurrency([], "AED")).toBeNull();
  });
});

describe("defaultFirstBudgetCurrency", () => {
  it("is the currency most active non-card accounts hold", () => {
    const accounts = [
      account("a", { currency: "USD" }),
      account("b", { currency: "USD" }),
      account("c"),
    ];
    expect(defaultFirstBudgetCurrency(accounts)).toBe("USD");
  });

  it("ignores cards and archived accounts", () => {
    const accounts = [
      account("a"),
      account("b", { currency: "USD", type: "credit_card" }),
      account("c", { currency: "USD", type: "credit_card" }),
      account("d", { currency: "USD", archived: true }),
    ];
    expect(defaultFirstBudgetCurrency(accounts)).toBe("AED");
  });

  it("lets AED win a tie, and is AED with no accounts", () => {
    expect(defaultFirstBudgetCurrency([account("a", { currency: "USD" }), account("b")])).toBe(
      "AED",
    );
    expect(defaultFirstBudgetCurrency([])).toBe("AED");
  });

  it("breaks a tie between other currencies by code", () => {
    expect(
      defaultFirstBudgetCurrency([
        account("a", { currency: "USD" }),
        account("b", { currency: "SAR" }),
      ]),
    ).toBe("SAR");
  });
});

describe("promptCurrencies", () => {
  const accounts = [account("aed"), account("usd-1", { currency: "USD" })];

  it("offers a currency with an active account and no budget", () => {
    expect(promptCurrencies(accounts, ["AED"], {})).toEqual(["USD"]);
  });

  it("offers nothing for currencies that have a budget, or only archived accounts", () => {
    expect(promptCurrencies(accounts, ["AED", "USD"], {})).toEqual([]);
    expect(
      promptCurrencies([account("old", { currency: "USD", archived: true })], ["AED"], {}),
    ).toEqual([]);
  });

  it("stays dismissed until a new account in that currency appears", () => {
    const dismissed = dismissCurrencyPrompt(EMPTY_BUDGET_CURRENCY_STATE, "USD", accounts);
    expect(promptCurrencies(accounts, ["AED"], dismissed.dismissed)).toEqual([]);

    const more = [...accounts, account("usd-2", { currency: "USD" })];
    expect(promptCurrencies(more, ["AED"], dismissed.dismissed)).toEqual(["USD"]);
  });

  it("keeps each currency's dismissal apart", () => {
    const both = [...accounts, account("sar", { currency: "SAR" })];
    const dismissed = dismissCurrencyPrompt(EMPTY_BUDGET_CURRENCY_STATE, "USD", both);
    expect(promptCurrencies(both, ["AED"], dismissed.dismissed)).toEqual(["SAR"]);
  });
});

describe("stored choice", () => {
  it("round-trips and reads damaged data as the defaults", () => {
    const state = dismissCurrencyPrompt(
      { ...EMPTY_BUDGET_CURRENCY_STATE, selected: "USD" },
      "SAR",
      [account("sar", { currency: "SAR" })],
    );
    expect(parseBudgetCurrencyState(serializeBudgetCurrencyState(state))).toEqual(state);
    expect(parseBudgetCurrencyState("{broken")).toEqual(EMPTY_BUDGET_CURRENCY_STATE);
    expect(parseBudgetCurrencyState(null)).toEqual(EMPTY_BUDGET_CURRENCY_STATE);
  });
});

describe("per-currency request keys", () => {
  it("never reuses one idempotency key across currencies", async () => {
    let next = 0;
    const run = createRequestKeyRunner(() => `key-${(next += 1)}`);
    const keys: string[] = [];
    const failOnce = (operation: string) =>
      run(operation, "same-body", async (key) => {
        keys.push(key);
        throw new Error("uncertain");
      }).catch(() => undefined);

    await failOnce(budgetOperation("budget.update", "AED"));
    await failOnce(budgetOperation("budget.update", "USD"));
    // A retry of the same write in the same currency replays its own key.
    await failOnce(budgetOperation("budget.update", "AED"));

    expect(keys).toEqual(["key-1", "key-2", "key-1"]);
  });
});
