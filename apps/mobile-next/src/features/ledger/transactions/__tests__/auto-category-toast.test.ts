import type { V2Category, V2CreatedTransaction } from "@trove/api/v2/contracts";

import { autoCategoryToast } from "../auto-category-toast";

const stamp = {
  version: 1,
  createdAt: "2026-09-28T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
};
const groceries: V2Category = {
  ...stamp,
  id: "groceries",
  ledgerId: "personal:guest-1",
  name: "Groceries",
  kind: "expense",
  color: "#4a8f69",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  archived: false,
};
const created = (
  autoCategorization?: V2CreatedTransaction["autoCategorization"],
  note = "Breadfast",
): V2CreatedTransaction => ({
  ...stamp,
  id: "transaction-1",
  ledgerId: "personal:guest-1",
  accountId: "account-1",
  categoryId: autoCategorization?.outcome === "categorized" ? "groceries" : null,
  toAccountId: null,
  kind: "expense",
  amountMinor: 45_000,
  currency: "EGP",
  date: "2026-09-28",
  note,
  recurringRuleId: null,
  autoCategorization,
});

describe("autoCategoryToast", () => {
  it("names the note and the category AI chose", () => {
    expect(
      autoCategoryToast(
        created({ outcome: "categorized", source: "research", category: groceries }),
      ),
    ).toEqual({ emoji: "✨", message: "“Breadfast” auto-categorized to 🛒 Groceries" });
  });

  it("shortens long notes", () => {
    const toast = autoCategoryToast(
      created(
        { outcome: "categorized", source: "jev", category: groceries },
        "Weekly groceries from the big market downtown",
      ),
    );
    expect(toast?.message).toBe("“Weekly groceries from the b…” auto-categorized to 🛒 Groceries");
  });

  it.each(["skipped", "uncategorized", "rate_limited", "unavailable"] as const)(
    "stays silent when the outcome is %s",
    (outcome) => {
      expect(autoCategoryToast(created({ outcome }))).toBeNull();
    },
  );

  it("stays silent when AI was not asked", () => {
    expect(autoCategoryToast(created())).toBeNull();
  });
});
