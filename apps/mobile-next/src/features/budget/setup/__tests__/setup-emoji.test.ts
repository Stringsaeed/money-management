import type { V2Category } from "@trove/api/v2/contracts";

import { itemEmoji } from "../setup-emoji";
import type { SetupItem } from "../setup-items";

const item = (name: string, categoryId: string | null): SetupItem => ({
  key: name,
  name,
  group: "everyday",
  categoryId,
  defaultTicked: true,
  recurringMinor: null,
  lastPeriodMinor: null,
});

const category = (id: string, icon: string): V2Category => ({
  id,
  ledgerId: "ledger",
  name: id,
  kind: "expense",
  color: "#000000",
  icon,
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

describe("item emoji", () => {
  const categories = [category("food", "🥦"), category("legacy", "tag")];

  it("prefers the Category's own emoji, then the preset's, then a plain tag", () => {
    expect(itemEmoji(item("Groceries", "food"), categories)).toBe("🥦");
    expect(itemEmoji(item("Groceries", "legacy"), categories)).toBe("🛒");
    expect(itemEmoji(item("dewa", null), categories)).toBe("💡");
    expect(itemEmoji(item("Pets", null), categories)).toBe("🏷️");
  });
});
