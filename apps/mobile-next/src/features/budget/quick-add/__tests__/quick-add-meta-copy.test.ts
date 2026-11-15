import type { V2Account, V2Category } from "@trove/api/v2/contracts";

import { quickAddMetaCopy } from "../quick-add-meta-copy";

const cash: V2Account = {
  id: "cash",
  ledgerId: "ledger",
  name: "Cash",
  type: "cash",
  currency: "AED",
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

const coffee: V2Category = {
  id: "coffee",
  ledgerId: "ledger",
  name: "Coffee",
  kind: "expense",
  color: "#000000",
  icon: "☕",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

const base = { account: cash, date: "2026-01-02", category: coffee, categoryCount: 1, note: "" };

describe("quickAddMetaCopy", () => {
  it("names the account with its type's emoji", () => {
    expect(quickAddMetaCopy(base).account).toEqual({
      emoji: "💵",
      label: "Cash",
      accessibilityLabel: "Paid with: Cash",
    });
  });

  it("asks for an account when none is on offer", () => {
    expect(quickAddMetaCopy({ ...base, account: null }).account.label).toBe("Paid with");
  });

  it("offers the category only when the envelope maps to several", () => {
    expect(quickAddMetaCopy(base).category).toBeNull();
    expect(quickAddMetaCopy({ ...base, categoryCount: 2 }).category?.label).toBe("Coffee");
  });

  it("prints the note, or a prompt for one", () => {
    expect(quickAddMetaCopy({ ...base, note: " Team dinner " }).note.label).toBe("Team dinner");
    expect(quickAddMetaCopy(base).note).toMatchObject({
      label: "Note",
      accessibilityLabel: "Add a note",
    });
  });
});
