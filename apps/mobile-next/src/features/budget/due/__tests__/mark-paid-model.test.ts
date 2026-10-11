import type { V2Account } from "@trove/api/v2/contracts";

import { markPaidAccounts, markPaidDefaultAccountId } from "../mark-paid-model";

const account = (id: string, patch: Partial<V2Account> = {}): V2Account => ({
  id,
  ledgerId: "ledger",
  name: id,
  type: "checking",
  currency: "AED",
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  ...patch,
});

const accounts = [
  account("bank"),
  account("savings", { type: "savings" }),
  account("card", { type: "credit_card" }),
  account("old-bank", { archived: true }),
  account("usd", { currency: "USD" }),
];

describe("markPaidAccounts", () => {
  it("offers an AED bill only the funding accounts and credit cards the budget counts", () => {
    const ids = markPaidAccounts(accounts, { currency: "AED" }, ["bank", "old-bank"], "AED").map(
      (item) => item.id,
    );
    expect(ids).toEqual(["bank", "card"]);
  });

  it("offers a bill in another currency every active account in that currency", () => {
    expect(
      markPaidAccounts(accounts, { currency: "USD" }, ["bank"], "AED").map((item) => item.id),
    ).toEqual(["usd"]);
  });
});

describe("markPaidDefaultAccountId", () => {
  const choices = [account("bank"), account("card", { type: "credit_card" })];

  it("keeps the bill's account when it is on offer", () => {
    expect(markPaidDefaultAccountId(choices, { accountId: "card" })).toBe("card");
  });

  it("falls back to the first budget account when the bill's account is not on offer", () => {
    expect(markPaidDefaultAccountId(choices, { accountId: "savings" })).toBe("bank");
  });
});
