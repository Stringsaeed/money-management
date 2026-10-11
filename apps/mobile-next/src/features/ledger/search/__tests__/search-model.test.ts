import type { V2Transaction } from "@trove/api/v2/contracts";

import { monthTitle } from "../../list/ledger-grouping";
import { ledgerRowStamp } from "../../list/ledger-row-stamp";
import { highlightParts } from "../search-highlight";
import {
  dateChipLabel,
  EMPTY_SEARCH,
  isSearching,
  resultsStamp,
  searchFilters,
} from "../search-model";

const today = new Date(2026, 9, 11);
const localIso = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();

const transaction = (patch: Partial<V2Transaction>): V2Transaction => ({
  id: "t",
  ledgerId: "l",
  accountId: "a",
  categoryId: null,
  toAccountId: null,
  kind: "expense",
  amountMinor: 21_430,
  currency: "AED",
  date: "2026-10-11",
  note: "Carrefour City Centre",
  recurringRuleId: null,
  version: 0,
  createdAt: localIso("2026-10-11", "08:12"),
  updatedAt: localIso("2026-10-11", "08:12"),
  ...patch,
});

describe("search model", () => {
  it("waits for a query or a filter before searching", () => {
    expect(isSearching(EMPTY_SEARCH)).toBe(false);
    expect(isSearching({ ...EMPTY_SEARCH, query: "   " })).toBe(false);
    expect(isSearching({ ...EMPTY_SEARCH, query: "carrefour" })).toBe(true);
    expect(isSearching({ ...EMPTY_SEARCH, recurring: true })).toBe(true);
  });

  it("labels the date chip as the board does", () => {
    expect(dateChipLabel("any", today)).toBe("Any time");
    expect(dateChipLabel("last-3-months", today)).toBe("Since Aug");
    expect(dateChipLabel("last-month", today)).toBe("Sep");
    expect(dateChipLabel("this-year", today)).toBe("Since Jan");
  });

  it("turns the chips into server filters", () => {
    expect(
      searchFilters(
        {
          query: "carrefour",
          date: "last-3-months",
          accountId: "card",
          categoryId: "groceries",
          recurring: true,
        },
        today,
      ),
    ).toEqual({
      accountIds: ["card"],
      categoryIds: ["groceries"],
      from: "2026-08-01",
      to: "2026-10-31",
      search: "carrefour",
      recurring: true,
    });
    expect(searchFilters(EMPTY_SEARCH, today)).toMatchObject({ from: null, to: null });
  });

  it("counts results with the date window", () => {
    expect(resultsStamp(5, "last-3-months", today)).toBe("5 RESULTS · SINCE AUG");
    expect(resultsStamp(1, "any", today)).toBe("1 RESULT · ANY TIME");
  });
});

describe("search highlight", () => {
  it("marks the first case-insensitive match", () => {
    expect(highlightParts("Weekly shop, Carrefour", "carrefour")).toEqual({
      pre: "Weekly shop, ",
      hit: "Carrefour",
      post: "",
    });
  });

  it("leaves the title plain without a query or a match", () => {
    expect(highlightParts("Carrefour", "  ")).toBeNull();
    expect(highlightParts("Spinneys", "carrefour")).toBeNull();
  });
});

describe("search result stamps", () => {
  it("leads with the date when results are grouped by month", () => {
    expect(ledgerRowStamp(transaction({}), {}, { datedFrom: today })).toBe(
      "TODAY 08:12 · UNCATEGORISED",
    );
    expect(
      ledgerRowStamp(
        transaction({ date: "2026-10-01", createdAt: localIso("2026-10-02", "09:00") }),
        {},
        { datedFrom: today },
      ),
    ).toBe("THU 1 OCT · UNCATEGORISED");
  });

  it("names the month, with the year only outside this one", () => {
    expect(monthTitle("2026-10-01", today)).toBe("OCTOBER");
    expect(monthTitle("2025-09-01", today)).toBe("SEPTEMBER 2025");
  });
});
