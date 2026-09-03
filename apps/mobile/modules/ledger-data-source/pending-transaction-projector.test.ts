import type { ProjectableCommand } from "@/lib/sync/outbox";

import {
  projectPendingTransactions,
  type PendingTransactionCommandKind,
  type PendingTransactionPayload,
} from "./pending-transaction-projector";
import type { SyncedTransactionSnapshot } from "./synced-transaction-snapshot";

const HOUSEHOLD_ID = "household-1";
const timestamp = "2026-01-01T00:00:00.000Z";

const snapshot: SyncedTransactionSnapshot = {
  householdId: HOUSEHOLD_ID,
  userId: "user-1",
  accounts: [
    {
      householdId: HOUSEHOLD_ID,
      id: "cash",
      name: "Cash",
      type: "bank",
      currency: "USD",
      color: "#000",
      icon: "banknote.fill",
      initialBalanceMinor: 0,
      excludeFromTotal: false,
      sortOrder: 0,
      lifecycle: "active",
      lifecycleChangedAt: null,
      visibility: "public",
      ownerUserId: "user-1",
      version: 0,
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      householdId: HOUSEHOLD_ID,
      id: "card",
      name: "Card",
      type: "card",
      currency: "USD",
      color: "#000",
      icon: "creditcard.fill",
      initialBalanceMinor: 0,
      excludeFromTotal: false,
      sortOrder: 1,
      lifecycle: "active",
      lifecycleChangedAt: null,
      visibility: "public",
      ownerUserId: "user-1",
      version: 0,
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  categories: [],
  transactions: [
    {
      householdId: HOUSEHOLD_ID,
      id: "original",
      type: "expense",
      amountMinor: 500,
      currency: "USD",
      originalAmountMinor: null,
      originalCurrency: null,
      exchangeRate: null,
      date: "2026-01-02",
      accountId: "card",
      toAccountId: null,
      categoryId: "groceries",
      isRecurring: false,
      recurringRuleId: null,
      description: "Groceries",
      version: 2,
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
};

const command = (
  kind: PendingTransactionCommandKind,
  payload: PendingTransactionPayload,
  sequence: number,
): ProjectableCommand => ({
  commandId: `command-${sequence}`,
  householdId: HOUSEHOLD_ID,
  kind,
  payload,
  issuedAt: `2026-01-0${sequence}T00:00:00.000Z`,
  status: "pending",
});

describe("projectPendingTransactions", () => {
  it("folds queued Transaction intents in FIFO order", () => {
    const projected = projectPendingTransactions(snapshot, [
      command(
        "transaction.create",
        {
          id: "created",
          type: "expense",
          amountMinor: 100,
          date: "2026-01-03",
          accountId: "cash",
          categoryId: "groceries",
        },
        1,
      ),
      command("transaction.edit", { transactionId: "created", amountMinor: 125 }, 2),
      command(
        "refund.link",
        {
          transactionId: "refund",
          originalTransactionId: "original",
          depositAccountId: "card",
          currency: "USD",
          amountMinor: 50,
          date: "2026-01-05",
        },
        3,
      ),
      command("transaction.remove", { transactionId: "original" }, 4),
    ]);

    expect(projected.transactions.map((row) => row.id).sort()).toEqual(["created", "refund"]);
    expect(projected.transactions.find((row) => row.id === "created")).toMatchObject({
      amountMinor: 125,
      version: 1,
    });
    expect(projected.transactions.find((row) => row.id === "refund")).toMatchObject({
      categoryId: "groceries",
      type: "income",
    });
  });

  it("fails closed when an optimistic intent references an unauthorized Account", () => {
    const projected = projectPendingTransactions(snapshot, [
      command(
        "transaction.create",
        {
          id: "hidden",
          type: "expense",
          amountMinor: 100,
          date: "2026-01-03",
          accountId: "private-account-not-in-snapshot",
          categoryId: "groceries",
        },
        1,
      ),
    ]);

    expect(projected.transactions.some((row) => row.id === "hidden")).toBe(false);
  });
});
