import { describe, expect, it } from "@jest/globals";

import type { V2Account } from "@trove/api/v2/contracts";

import { DEFAULT_BUDGET_CURRENCY } from "@/data/budget-currency";

import { homeCurrency, homeGreeting, homeIdentity, signedMinor } from "../home-display";

describe("signedMinor", () => {
  it("makes spending negative and keeps money in and transfers positive", () => {
    expect(signedMinor("expense", 1250)).toBe(-1250);
    expect(signedMinor("income", 1250)).toBe(1250);
    expect(signedMinor("transfer", 1250)).toBe(1250);
  });

  it("does not double-negate an already signed expense", () => {
    expect(signedMinor("expense", -1250)).toBe(-1250);
  });
});

describe("homeIdentity", () => {
  it("derives initials from a signed-in user's full name", () => {
    expect(
      homeIdentity({
        kind: "user",
        userId: "u1",
        workosUserId: "w1",
        email: "ada@example.com",
        name: "Ada Byron",
      }),
    ).toEqual({ name: "Ada", initials: "AB" });
  });

  it("falls back to the email when the name is empty", () => {
    expect(
      homeIdentity({
        kind: "user",
        userId: "u1",
        workosUserId: "w1",
        email: "ada@example.com",
        name: "",
      }).initials,
    ).toBe("A");
  });

  it("greets a guest as a friend", () => {
    expect(homeIdentity({ kind: "guest", guestSessionId: "g1" })).toEqual({
      name: "friend",
      initials: "G",
    });
  });
});

describe("homeGreeting", () => {
  it("says morning before noon, afternoon until five, evening after", () => {
    expect(homeGreeting(0)).toBe("Morning");
    expect(homeGreeting(11)).toBe("Morning");
    expect(homeGreeting(12)).toBe("Afternoon");
    expect(homeGreeting(16)).toBe("Afternoon");
    expect(homeGreeting(17)).toBe("Evening");
  });
});

const account = (id: string, currency: string, archived = false): V2Account => ({
  id,
  ledgerId: "l1",
  name: id,
  type: "checking",
  currency,
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived,
  version: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

describe("homeCurrency", () => {
  it("follows the budget's currency when an account holds it", () => {
    expect(homeCurrency([account("a", "USD"), account("b", "AED")], "AED")).toBe("AED");
  });

  it("otherwise takes the currency most active accounts hold", () => {
    const accounts = [account("a", "USD"), account("b", "AED"), account("c", "AED")];
    expect(homeCurrency(accounts, null)).toBe("AED");
  });

  it("ignores archived accounts and a budget currency nobody holds", () => {
    const accounts = [account("a", "EUR"), account("b", "AED", true)];
    expect(homeCurrency(accounts, "AED")).toBe("EUR");
  });

  it("falls back to the budget currency, then the default, with no accounts", () => {
    expect(homeCurrency([], "EUR")).toBe("EUR");
    expect(homeCurrency([], null)).toBe(DEFAULT_BUDGET_CURRENCY);
  });
});
