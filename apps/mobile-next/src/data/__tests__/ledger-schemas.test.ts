import {
  parseAccount,
  parseCreatedTransaction,
  parsePage,
  parseTransaction,
  transactionSchema,
} from "@/data/ledger-schemas";
import { parseMoneyMinor } from "@/utils/money";
import { dateKeyFromPicker, datePickerValue } from "@/utils/date";

describe("V2 ledger response parsing", () => {
  it("accepts V2 account types and rejects obsolete variants", () => {
    const account = parseAccount({
      id: "account-1",
      ledgerId: "personal:guest-1",
      name: "Checking",
      type: "checking",
      currency: "USD",
      openingBalanceMinor: 1000,
      balanceMinor: 1000,
      archived: false,
      version: 1,
      createdAt: "2026-09-21T00:00:00.000Z",
      updatedAt: "2026-09-21T00:00:00.000Z",
    });

    expect(account.type).toBe("checking");
    expect(() => parseAccount({ ...account, type: "bank" })).toThrow();
  });

  it("rejects malformed transaction money and dates", () => {
    expect(() => parseTransaction({ id: "tx-1", amountMinor: 1.5 })).toThrow();
    expect(() =>
      transactionSchema.parse({
        id: "tx-1",
        ledgerId: "personal:guest-1",
        accountId: "account-1",
        categoryId: null,
        toAccountId: null,
        kind: "expense",
        amountMinor: 100,
        currency: "USD",
        date: "09/21/2026",
        note: "Coffee",
        recurringRuleId: null,
        version: 1,
        createdAt: "2026-09-21T00:00:00.000Z",
        updatedAt: "2026-09-21T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("reads a create's AI categorization without letting a malformed one fail the save", () => {
    const transaction = {
      id: "tx-1",
      ledgerId: "personal:guest-1",
      accountId: "account-1",
      categoryId: "groceries",
      toAccountId: null,
      kind: "expense",
      amountMinor: 45_000,
      currency: "EGP",
      date: "2026-09-28",
      note: "Breadfast",
      recurringRuleId: null,
      version: 1,
      createdAt: "2026-09-28T00:00:00.000Z",
      updatedAt: "2026-09-28T00:00:00.000Z",
    };
    const category = {
      id: "groceries",
      ledgerId: "personal:guest-1",
      name: "Groceries",
      kind: "expense",
      color: "#4a8f69",
      icon: "🛒",
      parentId: null,
      sortOrder: 0,
      archived: false,
      version: 0,
      createdAt: "2026-09-28T00:00:00.000Z",
      updatedAt: "2026-09-28T00:00:00.000Z",
    };

    expect(
      parseCreatedTransaction({
        ...transaction,
        autoCategorization: { outcome: "categorized", source: "research", category },
      }).autoCategorization,
    ).toMatchObject({ outcome: "categorized", category: { name: "Groceries" } });
    expect(
      parseCreatedTransaction({ ...transaction, autoCategorization: { outcome: "surprise" } }),
    ).not.toHaveProperty("autoCategorization");
    expect(parseCreatedTransaction(transaction).id).toBe("tx-1");
  });

  it("parses paged collections without silently changing the cursor", () => {
    const page = parsePage(transactionSchema, {
      items: [],
      nextCursor: "next-page",
    });
    expect(page.nextCursor).toBe("next-page");
    expect(page.items).toEqual([]);
  });

  it.each([
    ["0.29", "USD", 29],
    ["12", "JPY", 12],
    ["1.234", "KWD", 1234],
  ])("parses exact %s %s minor units", (input, currency, expected) => {
    expect(parseMoneyMinor(input, currency)).toBe(expected);
  });

  it.each([
    ["1.234", "USD"],
    ["1,23", "USD"],
    ["9007199254740992", "USD"],
  ])("rejects unsafe or malformed money %s %s", (input, currency) => {
    expect(parseMoneyMinor(input, currency)).toBeNull();
  });

  it("round-trips date-only native picker values at UTC midnight", () => {
    const picked = datePickerValue("2026-09-21");
    expect(dateKeyFromPicker(picked)).toBe("2026-09-21");
    expect(dateKeyFromPicker(new Date("2026-01-02T00:00:00.000Z"))).toBe("2026-01-02");
  });
});
