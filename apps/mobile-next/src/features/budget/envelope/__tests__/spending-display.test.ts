import type { V2Transaction } from "@trove/api/v2/contracts";

import { spendingRowDisplay } from "../spending-display";

const transaction = (overrides: Partial<V2Transaction>): V2Transaction => ({
  id: "t1",
  ledgerId: "l1",
  accountId: "card",
  categoryId: "food",
  toAccountId: null,
  kind: "expense",
  amountMinor: 21_430,
  currency: "AED",
  date: "2026-10-12",
  note: "Carrefour",
  recurringRuleId: null,
  version: 1,
  createdAt: "2026-10-12T08:12:00",
  updatedAt: "2026-10-12T08:12:00",
  ...overrides,
});

const today = new Date(2026, 9, 12, 18, 0);
const lookups = { category: { name: "Groceries" }, account: { name: "ENBD card" } };

describe("spendingRowDisplay", () => {
  it("prints the note, when it was logged, the account and the unsigned figure", () => {
    expect(spendingRowDisplay(transaction({}), lookups, today)).toEqual({
      title: "Carrefour",
      meta: "TODAY 08:12 · ENBD CARD",
      figure: "214.30",
      amountLabel: "214.30 AED",
    });
  });

  it("dates older entries and falls back to the Category name", () => {
    const row = spendingRowDisplay(
      transaction({ note: " ", date: "2026-10-08", createdAt: "2026-10-09T10:00:00" }),
      lookups,
      today,
    );
    expect(row.title).toBe("Groceries");
    expect(row.meta).toBe("THU 8 OCT · ENBD CARD");
  });

  it("says Recurring for entries a rule added", () => {
    const row = spendingRowDisplay(
      transaction({ date: "2026-10-11", recurringRuleId: "rule" }),
      lookups,
      today,
    );
    expect(row.meta).toBe("YESTERDAY · RECURRING");
  });
});
