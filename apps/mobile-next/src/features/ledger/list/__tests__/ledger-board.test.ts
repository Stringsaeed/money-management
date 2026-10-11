import type {
  V2Account,
  V2Category,
  V2Transaction,
  V2TransactionSummary,
} from "@trove/api/v2/contracts";

import { dayTitle } from "../ledger-grouping";
import { plainAmount } from "../ledger-money";
import { ledgerRowStamp, loggedTime } from "../ledger-row-stamp";
import { periodLabel, primaryTotals, totalsPeriod } from "../ledger-totals";

const stamp = "2026-10-01T00:00:00.000Z";
/** A local wall-clock instant, so the logged time reads the same in any time zone. */
const localIso = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();

const transaction = (patch: Partial<V2Transaction> = {}): V2Transaction => ({
  id: "t",
  ledgerId: "l",
  accountId: "a",
  categoryId: "c",
  toAccountId: null,
  kind: "expense",
  amountMinor: 6420,
  currency: "AED",
  date: "2026-10-11",
  note: "Weekly groceries",
  recurringRuleId: null,
  version: 0,
  createdAt: localIso("2026-10-11", "08:12"),
  updatedAt: stamp,
  ...patch,
});
const account = (name: string): V2Account => ({
  id: name,
  ledgerId: "l",
  name,
  type: "checking",
  currency: "AED",
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived: false,
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

describe("ledger row stamp", () => {
  it("prints the logged time, category and account in caps", () => {
    expect(
      ledgerRowStamp(transaction(), { category: groceries, account: account("ENBD Card") }),
    ).toBe("08:12 · GROCERIES · ENBD CARD");
  });

  it("omits the time of an entry logged on another day", () => {
    const backdated = transaction({ createdAt: localIso("2026-10-12", "09:30") });
    expect(loggedTime(backdated)).toBeNull();
    expect(ledgerRowStamp(backdated, { category: groceries, account: account("Cash") })).toBe(
      "GROCERIES · CASH",
    );
  });

  it("marks recurring entries instead of naming the account", () => {
    const bill = transaction({ recurringRuleId: "r", createdAt: localIso("2026-10-07", "09:00") });
    expect(
      ledgerRowStamp(
        { ...bill, date: "2026-10-07" },
        { category: groceries, account: account("Cash") },
      ),
    ).toBe("09:00 · GROCERIES · RECURRING");
  });

  it("names both ends of a transfer and labels uncategorised spending", () => {
    const transfer = transaction({ kind: "transfer", categoryId: null, createdAt: stamp });
    expect(
      ledgerRowStamp(transfer, { account: account("Cash"), toAccount: account("Savings") }),
    ).toBe("TRANSFER · CASH → SAVINGS");
    expect(ledgerRowStamp(transaction({ createdAt: stamp }), {})).toBe("UNCATEGORISED");
  });
});

describe("ledger day stamps", () => {
  const today = new Date(2026, 9, 11);

  it("reads TODAY, YESTERDAY, then weekday and date", () => {
    expect(dayTitle("2026-10-11", today)).toBe("TODAY");
    expect(dayTitle("2026-10-10", today)).toBe("YESTERDAY");
    expect(dayTitle("2026-10-07", today)).toBe("WED 07.10");
    expect(dayTitle("2025-12-31", today)).toBe("WED 31.12.25");
  });
});

describe("ledger totals", () => {
  const today = new Date(2026, 9, 11);

  it("counts this month when no date filter is applied", () => {
    expect(totalsPeriod(null, today)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
      label: "OCT",
    });
  });

  it("follows the date filter and labels its months", () => {
    expect(totalsPeriod({ from: "2026-07-14", to: "2026-10-11" }, today).label).toBe("JUL–OCT");
    expect(periodLabel(new Date(2025, 10, 1), new Date(2026, 9, 31))).toBe("NOV 25–OCT 26");
  });

  it("shows the currency with the most entries and flags a mix", () => {
    const summary: V2TransactionSummary = {
      count: 12,
      totals: [
        { currency: "USD", count: 2, incomeMinor: 0, expenseMinor: 500, netMinor: -500 },
        {
          currency: "AED",
          count: 10,
          incomeMinor: 1_200_000,
          expenseMinor: 428_600,
          netMinor: 771_400,
        },
      ],
    };
    expect(primaryTotals(summary)).toEqual({
      currency: "AED",
      incomeMinor: 1_200_000,
      expenseMinor: 428_600,
      mixed: true,
    });
    expect(primaryTotals({ count: 0, totals: [] })).toBeNull();
    expect(primaryTotals(undefined)).toBeNull();
  });

  it("prints figures without a currency sign", () => {
    expect(plainAmount(1_200_000, "AED", "always")).toBe("+12,000.00");
    expect(plainAmount(-428_600, "AED")).toBe("−4,286.00");
    expect(plainAmount(0, "AED")).toBe("0.00");
  });
});
