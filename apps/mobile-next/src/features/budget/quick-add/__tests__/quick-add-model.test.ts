import type { V2Account, V2Envelope, V2EnvelopeTotals } from "@trove/api/v2/contracts";

import { ApiError } from "@/data/http";

import type { EnvelopeLine } from "../../home/home-model";
import {
  datePlacement,
  filterEnvelopes,
  impactLine,
  orderEnvelopes,
  paidWithAccounts,
  placementText,
  resolveDefaultAccountId,
  saveErrorMessage,
} from "../quick-add-model";

const money = (minor: number) => `AED ${(minor / 100).toFixed(2)}`;

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

const line = (id: string, name = id): EnvelopeLine => {
  const envelope: V2Envelope = {
    id,
    name,
    group: "everyday",
    startFresh: false,
    targetMinor: null,
    dueDate: null,
    repeat: null,
    archived: false,
    sortOrder: 0,
    categoryIds: [`cat-${id}`],
    version: 1,
  };
  const totals: V2EnvelopeTotals = {
    id,
    plannedMinor: 0,
    budgetedMinor: 0,
    spentMinor: 0,
    rolloverMinor: 0,
    leftMinor: 0,
  };
  return { envelope, totals };
};

describe("impactLine", () => {
  it("says how far over the envelope ends up", () => {
    expect(impactLine("Dining & coffee", 10_000, 27_500, money)).toEqual({
      text: "Dining & coffee will be AED 175.00 over",
      over: true,
      overMinor: 17_500,
    });
  });

  it("says what is left when it stays within the envelope", () => {
    expect(impactLine("Groceries", 10_000, 6_000, money)).toEqual({
      text: "Groceries will have AED 40.00 left",
      over: false,
      overMinor: 0,
    });
  });

  it("counts an envelope that is already over", () => {
    expect(impactLine("Fuel", -1_000, 500, money)?.overMinor).toBe(1_500);
  });

  it("spending exactly what is left is not over", () => {
    expect(impactLine("Fuel", 500, 500, money)?.over).toBe(false);
  });

  it("shows nothing before an amount is typed", () => {
    expect(impactLine("Fuel", 500, 0, money)).toBeNull();
  });
});

describe("resolveDefaultAccountId", () => {
  const eligible = ["cash", "bank", "card"];

  it("prefers the last used account", () => {
    expect(resolveDefaultAccountId(eligible, "card", "bank")).toBe("card");
  });

  it("falls back to the budget default when the last used one is gone", () => {
    expect(resolveDefaultAccountId(eligible, "archived", "bank")).toBe("bank");
    expect(resolveDefaultAccountId(eligible, null, "bank")).toBe("bank");
  });

  it("falls back to the first account on offer", () => {
    expect(resolveDefaultAccountId(eligible, null, "gone")).toBe("cash");
  });

  it("is null when there is nothing to pay with", () => {
    expect(resolveDefaultAccountId([], "card", "bank")).toBeNull();
  });
});

describe("paidWithAccounts", () => {
  it("lists funding accounts and credit cards, skipping archived and non-AED", () => {
    const accounts = [
      account("bank"),
      account("cash", { type: "cash" }),
      account("old", { archived: true }),
      account("usd", { currency: "USD" }),
      account("card", { type: "credit_card" }),
      account("usd-card", { type: "credit_card", currency: "USD" }),
      account("savings", { type: "savings" }),
    ];
    const result = paidWithAccounts(accounts, ["bank", "cash", "old", "usd"], "AED");
    expect(paidWithAccounts(accounts, ["usd"], "USD").cards.map((a) => a.id)).toEqual(["usd-card"]);
    expect(result.funding.map((a) => a.id)).toEqual(["bank", "cash"]);
    expect(result.cards.map((a) => a.id)).toEqual(["card"]);
  });

  it("reports no cards when the person has none", () => {
    expect(paidWithAccounts([account("bank")], ["bank"], "AED").cards).toEqual([]);
  });
});

describe("orderEnvelopes", () => {
  const lines = [line("a"), line("b"), line("c"), line("d")];

  it("puts recent envelopes first in recency order, then the rest", () => {
    expect(orderEnvelopes(lines, ["c", "a"]).map((l) => l.envelope.id)).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
  });

  it("ignores recent ids that no longer exist", () => {
    expect(orderEnvelopes(lines, ["gone", "d"]).map((l) => l.envelope.id)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
  });
});

describe("filterEnvelopes", () => {
  const lines = [line("a", "Groceries"), line("b", "Dining & coffee"), line("c", "Fuel")];

  it("matches names ignoring case and keeps the selected envelope", () => {
    expect(filterEnvelopes(lines, "  DIN ", "c").map((l) => l.envelope.id)).toEqual(["b", "c"]);
  });

  it("returns everything for an empty query", () => {
    expect(filterEnvelopes(lines, "", null)).toHaveLength(3);
  });
});

describe("datePlacement", () => {
  const base = {
    today: "2026-11-10",
    currentStart: "2026-10-25",
    activationStart: "2026-09-25",
    rule: { kind: "day", day: 25 } as const,
  };

  it("is current for a date inside the current period", () => {
    expect(datePlacement({ ...base, date: "2026-10-25" })).toEqual({ kind: "current" });
    expect(datePlacement({ ...base, date: "2026-11-10" })).toEqual({ kind: "current" });
  });

  it("names the earlier period a backdated date lands in", () => {
    const placement = datePlacement({ ...base, date: "2026-10-03" });
    expect(placement).toEqual({ kind: "earlier", label: "25 Sep – 24 Oct" });
    expect(placementText(placement)).toBe("Added to 25 Sep – 24 Oct");
  });

  it("flags dates from before the budget started", () => {
    expect(datePlacement({ ...base, date: "2026-08-30" })).toEqual({ kind: "before_budget" });
  });

  it("flags dates ahead of today", () => {
    expect(datePlacement({ ...base, date: "2026-11-11" })).toEqual({ kind: "future" });
  });
});

describe("saveErrorMessage", () => {
  it("is honest about being offline", () => {
    const offline = new ApiError(0, "The network is unavailable.", "network_error", null);
    expect(saveErrorMessage(offline)).toBe("You're offline. Nothing was saved.");
  });

  it("says nothing was saved for any other failure", () => {
    const rejected = new ApiError(500, "Boom", null, null);
    expect(saveErrorMessage(rejected)).toContain("Nothing was saved");
  });
});
