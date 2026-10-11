import type { V2Category, V2Transaction } from "@trove/api/v2/contracts";

import { ledgerRowDisplay } from "../ledger-row-display";

const stamp = "2026-09-01T00:00:00.000Z";
const transaction = (kind: V2Transaction["kind"]): V2Transaction => ({
  id: "t",
  ledgerId: "l",
  accountId: "a",
  categoryId: null,
  toAccountId: null,
  kind,
  amountMinor: 1250,
  currency: "AED",
  date: "2026-09-01",
  note: "",
  recurringRuleId: null,
  version: 0,
  createdAt: stamp,
  updatedAt: stamp,
});
const groceries: V2Category = {
  id: "c",
  ledgerId: "l",
  name: "Groceries",
  kind: "expense",
  color: "#4a8f69",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 0,
  createdAt: stamp,
  updatedAt: stamp,
};

describe("ledgerRowDisplay", () => {
  it("shows a categorised row on the neutral emoji tile", () => {
    const display = ledgerRowDisplay(transaction("expense"), { category: groceries });
    expect(display.kind).toBeNull();
    expect(display.tile).toBe("🛒");
    expect(display.signedMinor).toBe(-1250);
  });

  it("gives an uncategorised row its transaction kind tile", () => {
    expect(ledgerRowDisplay(transaction("expense"), {}).kind).toBe("expense");
    expect(ledgerRowDisplay(transaction("income"), {}).kind).toBe("income");
  });

  it("gives a transfer the transfer kind tile and no sign", () => {
    const display = ledgerRowDisplay(transaction("transfer"), { category: groceries });
    expect(display.kind).toBe("transfer");
    expect(display.signDisplay).toBe("never");
  });
});
