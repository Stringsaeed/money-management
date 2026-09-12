import { createTransactionWithDetails } from "@/tests/test-utils/factories";

import { applyLedgerFilters } from "./filters";
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
