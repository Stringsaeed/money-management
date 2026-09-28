import type { V2Account, V2Category, V2Transaction } from "@trove/api/v2/contracts";

import {
  activeFilters,
  EMPTY_LEDGER_FILTERS,
  presetRange,
  pruneFilters,
  removeFilter,
  toListFilters,
  type LedgerFilterState,
} from "../ledger-filters";
import { groupTransactions, headerIndices } from "../ledger-grouping";

const stamp = "2026-09-01T00:00:00.000Z";
const account = (id: string, archived = false): V2Account => ({
  id,
  ledgerId: "l",
  name: id.toUpperCase(),
  type: "checking",
  currency: "AED",
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived,
  version: 0,
  createdAt: stamp,
  updatedAt: stamp,
});
const category = (id: string): V2Category => ({
  id,
  ledgerId: "l",
  name: id,
  kind: "expense",
  color: "#4a8f69",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 0,
  createdAt: stamp,
  updatedAt: stamp,
});
const tx = (id: string, date: string, kind: V2Transaction["kind"], amountMinor: number) => ({
  id,
  ledgerId: "l",
  accountId: "a",
  categoryId: null,
  toAccountId: null,
  kind,
  amountMinor,
  currency: "AED",
  date,
  note: "",
  recurringRuleId: null,
  version: 0,
  createdAt: stamp,
  updatedAt: stamp,
});

describe("ledger filters", () => {
  const state: LedgerFilterState = {
    kinds: ["expense"],
    accountIds: ["a"],
    categoryIds: ["food"],
    range: presetRange("last-month", new Date(2026, 8, 28)),
    search: " lunch ",
  };

  it("lists every applied filter as a chip and removes exactly the one tapped", () => {
    const chips = activeFilters(state, [account("a")], [category("food")]);
    expect(chips.map((chip) => chip.label)).toEqual([
      "Expenses",
      "Last month",
      "A",
      "food",
      "“lunch”",
    ]);
    const withoutAccount = removeFilter(state, chips[2]!);
    expect(withoutAccount.accountIds).toEqual([]);
    expect(withoutAccount.categoryIds).toEqual(["food"]);
    expect(removeFilter(state, chips[1]!).range).toBeNull();
  });

  it("maps presets to calendar ranges and state to server filters", () => {
    expect(state.range).toMatchObject({ from: "2026-08-01", to: "2026-08-31" });
    expect(presetRange("last-90-days", new Date(2026, 8, 28))).toMatchObject({
      from: "2026-07-01",
      to: "2026-09-28",
    });
    expect(toListFilters(state)).toMatchObject({ from: "2026-08-01", to: "2026-08-31" });
    expect(toListFilters(EMPTY_LEDGER_FILTERS)).toMatchObject({ from: null, to: null });
  });

  it("drops archived or deleted Accounts and Categories from the selection", () => {
    const pruned = pruneFilters(state, [account("a", true)], []);
    expect(pruned.accountIds).toEqual([]);
    expect(pruned.categoryIds).toEqual([]);
    expect(pruneFilters(state, [account("a")], [category("food")])).toBe(state);
  });
});

describe("ledger grouping", () => {
  const today = new Date(2026, 8, 28);
  const rows = [
    tx("1", "2026-09-28", "expense", 500),
    tx("2", "2026-09-28", "income", 2_000),
    tx("3", "2026-09-27", "transfer", 900),
    tx("4", "2026-08-30", "expense", 100),
  ];

  it("sections newest-first rows by day with titles and per-day net", () => {
    const items = groupTransactions(rows, "day", today);
    expect(items.map((item) => (item.type === "header" ? item.title : item.key))).toEqual([
      "Today",
      "1",
      "2",
      "Yesterday",
      "3",
      "Sunday, 30 August",
      "4",
    ]);
    expect(items[0]).toMatchObject({ net: { minor: 1_500, currency: "AED" }, count: 2 });
    expect(items[3]).toMatchObject({ net: { minor: 0 } });
    expect(headerIndices(items)).toEqual([0, 3, 5]);
    expect(items[2]).toMatchObject({ lastInSection: true });
  });

  it("sections by month for statement layouts", () => {
    const items = groupTransactions(rows, "month", today);
    expect(items.filter((item) => item.type === "header").map((item) => item.key)).toEqual([
      "header:2026-09",
      "header:2026-08",
    ]);
  });
});
