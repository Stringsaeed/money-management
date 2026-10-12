import type {
  V2Account,
  V2Category,
  V2RecurringRule,
  V2Transaction,
} from "@trove/api/v2/contracts";

import { paidThisPeriod } from "../due-paid";

const rule = (id: string, mode: V2RecurringRule["mode"]): V2RecurringRule => ({
  id,
  ledgerId: "ledger",
  name: `Rule ${id}`,
  accountId: "enbd",
  categoryId: "cat",
  toAccountId: null,
  kind: "expense",
  amountMinor: 450_00,
  currency: "AED",
  note: "",
  frequency: "month",
  intervalCount: 1,
  startDate: "2026-01-01",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
  lifecycle: "active",
  health: "ready",
  mode,
  attentionReasons: [],
  eligibilityFloor: "2026-01-01",
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

const tx = (id: string, date: string, patch: Partial<V2Transaction> = {}): V2Transaction => ({
  id,
  ledgerId: "ledger",
  accountId: "enbd",
  categoryId: "cat",
  toAccountId: null,
  kind: "expense",
  amountMinor: 450_00,
  currency: "AED",
  date,
  note: "",
  recurringRuleId: "dewa",
  version: 1,
  createdAt: `${date}T08:00:00Z`,
  updatedAt: `${date}T08:00:00Z`,
  ...patch,
});

const accounts: V2Account[] = [
  {
    id: "enbd",
    ledgerId: "ledger",
    name: "ENBD Current",
    type: "checking",
    currency: "AED",
    openingBalanceMinor: 0,
    balanceMinor: 0,
    archived: false,
    version: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];
const categories: V2Category[] = [
  {
    id: "cat",
    ledgerId: "ledger",
    name: "Utilities",
    kind: "expense",
    color: "#000000",
    icon: "💡",
    parentId: null,
    sortOrder: 0,
    archived: false,
    version: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];
const period = { start: "2026-09-25", end: "2026-10-24" };

describe("paidThisPeriod", () => {
  it("lists bills a reminder rule posted this period, newest first", () => {
    const paid = paidThisPeriod({
      transactions: [
        tx("old", "2026-09-26"),
        tx("new", "2026-10-01"),
        tx("before", "2026-09-20"),
        tx("auto", "2026-10-02", { recurringRuleId: "rent" }),
        tx("manual", "2026-10-03", { recurringRuleId: null }),
        tx("salary", "2026-10-04", { kind: "income" }),
      ],
      rules: [rule("dewa", "remind"), rule("rent", "auto_post")],
      accounts,
      categories,
      period,
    });
    expect(paid.map((bill) => bill.id)).toEqual(["new", "old"]);
    expect(paid[0]).toMatchObject({
      name: "Rule dewa",
      icon: "💡",
      accountName: "ENBD Current",
      amountMinor: 450_00,
    });
  });
});
