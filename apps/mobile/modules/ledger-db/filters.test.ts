import { createTransactionWithDetails } from "@/tests/test-utils/factories";

import {
  applyLedgerFilters,
  dateRangeOf,
  pageTransactions,
  summarizeTransactions,
  toEditDate,
} from "./filters";
import type { LedgerTransaction } from "./types";

const row = (overrides: Parameters<typeof createTransactionWithDetails>[0]): LedgerTransaction => ({
  ...createTransactionWithDetails(overrides),
  version: 1,
  sync: { kind: "confirmed" },
});

describe("applyLedgerFilters", () => {
  it("keeps rows matching account (including toAccountId) and type filters", () => {
    const rows = [
      row({ id: "expense-main", accountId: "account-1", type: "expense", date: "2026-03-28" }),
      row({
        id: "transfer-in",
        accountId: "account-2",
        toAccountId: "account-1",
        type: "transfer",
        date: "2026-03-27",
      }),
      row({ id: "income-other", accountId: "account-2", type: "income", date: "2026-03-26" }),
    ];

    expect(
      applyLedgerFilters(rows, { accountId: "account-1", type: "transfer" }).map((item) => item.id),
    ).toEqual(["transfer-in"]);
  });

  it("sorts by date descending and applies limit after filtering", () => {
    const rows = [
      row({ id: "older", date: "2026-03-01", type: "expense" }),
      row({ id: "newer", date: "2026-03-28", type: "expense" }),
      row({ id: "mid", date: "2026-03-15", type: "expense" }),
      row({ id: "income", date: "2026-03-30", type: "income" }),
    ];

    expect(
      applyLedgerFilters(rows, { type: "expense", sort: "desc", limit: 2 }).map((item) => item.id),
    ).toEqual(["newer", "mid"]);
  });
});

describe("dateRangeOf", () => {
  it("returns null bounds for an empty row set", () => {
    expect(dateRangeOf([])).toEqual({ minDate: null, maxDate: null });
  });

  it("returns earliest and latest dates regardless of input order", () => {
    const rows = [
      row({ id: "mid", date: "2026-03-15" }),
      row({ id: "late", date: "2026-03-28" }),
      row({ id: "early", date: "2026-03-01" }),
    ];

    expect(dateRangeOf(rows)).toEqual({ minDate: "2026-03-01", maxDate: "2026-03-28" });
  });
});

describe("pageTransactions", () => {
  it("returns the first page with hasMore and nextCursor when more rows remain", () => {
    const rows = [
      row({ id: "oldest", date: "2026-03-01" }),
      row({ id: "newest", date: "2026-03-28" }),
      row({ id: "middle", date: "2026-03-15" }),
    ];

    const page = pageTransactions(rows, { limit: 2 });

    expect(page.transactions.map((item) => item.id)).toEqual(["newest", "middle"]);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toEqual({ date: "2026-03-15", id: "middle" });
  });

  it("continues from the cursor and clears hasMore on the final page", () => {
    const rows = [
      row({ id: "oldest", date: "2026-03-01" }),
      row({ id: "newest", date: "2026-03-28" }),
      row({ id: "middle", date: "2026-03-15" }),
    ];

    const page = pageTransactions(rows, {
      limit: 2,
      beforeDate: "2026-03-15",
      beforeId: "middle",
    });

    expect(page.transactions.map((item) => item.id)).toEqual(["oldest"]);
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });
});

describe("toEditDate", () => {
  it("returns undefined when the date is omitted", () => {
    expect(toEditDate(undefined)).toBeUndefined();
  });

  it("passes through string dates and formats Date instances", () => {
    expect(toEditDate("2026-03-28")).toBe("2026-03-28");
    expect(toEditDate(new Date(2026, 2, 28))).toBe("2026-03-28");
  });
});

describe("summarizeTransactions", () => {
  it("sums income and expense into netAmount", () => {
    expect(
      summarizeTransactions([
        createTransactionWithDetails({ id: "in-1", type: "income", amount: 50_00 }),
        createTransactionWithDetails({ id: "out-1", type: "expense", amount: 20_00 }),
        createTransactionWithDetails({ id: "out-2", type: "expense", amount: 5_00 }),
      ]),
    ).toEqual({ totalIncome: 50_00, totalExpense: 25_00, netAmount: 25_00 });
  });

  it("ignores transfers when totaling income and expense", () => {
    expect(
      summarizeTransactions([
        createTransactionWithDetails({ id: "xfer", type: "transfer", amount: 99_00 }),
        createTransactionWithDetails({ id: "in-1", type: "income", amount: 10_00 }),
      ]),
    ).toEqual({ totalIncome: 10_00, totalExpense: 0, netAmount: 10_00 });
  });
});
