import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { accountTransactionDisplay } from "../account-transaction-display";

const transaction = (overrides: Partial<V2Transaction>): V2Transaction => ({
  id: "t1",
  ledgerId: "l1",
  accountId: "a1",
  categoryId: null,
  toAccountId: null,
  kind: "expense",
  amountMinor: 1250,
  currency: "USD",
  date: "2026-01-02",
  note: "",
  recurringRuleId: null,
  version: 1,
  createdAt: "2026-01-02T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  ...overrides,
});

const category: V2Category = {
  id: "c1",
  ledgerId: "l1",
  name: "Groceries",
  kind: "expense",
  color: "#8B9D83",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("accountTransactionDisplay", () => {
  it("signs spending negative and shows the category", () => {
    const display = accountTransactionDisplay(transaction({ categoryId: "c1" }), category);
    expect(display).toMatchObject({
      title: "Groceries",
      subtitle: "2026-01-02 · Groceries",
      minor: -1250,
      signDisplay: "always",
      icon: "🛒",
      kind: undefined,
    });
  });

  it("keeps money in positive", () => {
    expect(
      accountTransactionDisplay(transaction({ kind: "income", note: "Salary" }), undefined),
    ).toMatchObject({ title: "Salary", minor: 1250, icon: undefined, kind: "income" });
  });

  it("falls back to the expense kind tile when nothing is categorised", () => {
    expect(accountTransactionDisplay(transaction({}), undefined)).toMatchObject({
      icon: undefined,
      kind: "expense",
    });
  });

  it("renders legacy icon slugs as the fallback emoji", () => {
    expect(
      accountTransactionDisplay(transaction({ categoryId: "c1" }), { ...category, icon: "tag" }),
    ).toMatchObject({ icon: "🏷️", kind: undefined });
  });

  it("hides the sign on transfers", () => {
    expect(
      accountTransactionDisplay(transaction({ kind: "transfer", categoryId: "c1" }), category),
    ).toMatchObject({ title: "Transfer", signDisplay: "never", icon: undefined, kind: "transfer" });
  });
});
