import type { V2Account } from "@trove/api/v2/contracts";

import { accountBalanceLabel, fundingRows, moneyToPlanMinor } from "../setup-accounts";

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

describe("funding rows", () => {
  const accounts = [
    account("card", { type: "credit_card", balanceMinor: -214_000 }),
    account("current", { balanceMinor: 1_240_000 }),
    account("savings", { type: "savings" }),
    account("eur", { currency: "EUR", balanceMinor: 312_000 }),
    account("old", { archived: true }),
  ];

  it("lists tickable accounts first and says why the rest are left out", () => {
    const rows = fundingRows(accounts, { funding: {} }, "AED", true);

    expect(rows.map((row) => [row.id, row.note, row.ticked, row.disabled])).toEqual([
      ["current", "Current account", true, false],
      ["savings", "Savings · not ticked by default", false, false],
      ["card", "Card spending comes out of envelopes", false, true],
      ["eur", "Not in your AED budget", false, true],
    ]);
  });

  it("prints names alone on the household step, keeping the reasons", () => {
    const rows = fundingRows(accounts, { funding: { savings: true } }, "AED", false);

    expect(rows.find((row) => row.id === "savings")).toMatchObject({ note: "", ticked: true });
    expect(rows.find((row) => row.id === "card")?.note).toBe(
      "Card spending comes out of envelopes",
    );
  });

  it("prints balances bare in the budget currency and marked in another", () => {
    expect(accountBalanceLabel(account("a", { balanceMinor: 1_240_000 }), "AED")).toBe("12,400.00");
    expect(accountBalanceLabel(account("b", { balanceMinor: -214_000 }), "AED")).toBe("−2,140.00");
    expect(
      accountBalanceLabel(account("c", { currency: "EUR", balanceMinor: 312_000 }), "AED"),
    ).toBe("€3,120.00");
    expect(accountBalanceLabel(account("d", { balanceMinor: 312_000 }), "USD")).toBe(
      "AED 3,120.00",
    );
  });
});

describe("money to plan", () => {
  const accounts = [account("a", { balanceMinor: 100 }), account("b", { balanceMinor: 50 })];

  it("adds the ticked balances, from the setup facts once they load", () => {
    const funding = { accountIds: ["a"], openingCashMinor: null, invalid: false };

    expect(moneyToPlanMinor(funding, accounts, null)).toBe(100);
    expect(moneyToPlanMinor(funding, accounts, [{ accountId: "a", balanceMinor: 80 }])).toBe(80);
  });

  it("is the typed total when no account can hold budget money", () => {
    expect(
      moneyToPlanMinor({ accountIds: [], openingCashMinor: 900, invalid: false }, accounts, null),
    ).toBe(900);
  });
});
