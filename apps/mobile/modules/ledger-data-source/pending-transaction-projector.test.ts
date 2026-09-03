import type { ProjectableCommand } from "@/lib/sync/outbox";

import {
  projectPendingLedger,
  type PendingAccountArchivePayload,
  type PendingAccountCreatePayload,
  type PendingAccountUpdatePayload,
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

const accountCommand = (
  kind: "account.create" | "account.update" | "account.archive" | "account.restore",
  payload: PendingAccountCreatePayload | PendingAccountUpdatePayload | PendingAccountArchivePayload,
  sequence: number,
): ProjectableCommand => ({
  commandId: `command-${sequence}`,
  householdId: HOUSEHOLD_ID,
  kind,
  payload,
  issuedAt: `2026-01-0${sequence}T00:00:00.000Z`,
  status: "pending",
});

describe("projectPendingLedger", () => {
  it("folds queued Transaction intents in FIFO order", () => {
    const projected = projectPendingLedger(snapshot, [
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
    const projected = projectPendingLedger(snapshot, [
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

  it("inserts a pending Account create owned by the snapshot viewer", () => {
    const projected = projectPendingLedger(snapshot, [
      accountCommand(
        "account.create",
        {
          id: "everyday",
          name: "Everyday",
          type: "bank",
          currency: "AED",
          color: "#4A90D9",
          icon: "🏦",
          initialBalanceMinor: 0,
          excludeFromTotal: false,
          sortOrder: 2,
        },
        1,
      ),
    ]);

    expect(projected.accounts.find((row) => row.id === "everyday")).toMatchObject({
      name: "Everyday",
      ownerUserId: "user-1",
      visibility: "public",
      lifecycle: "active",
      version: 0,
    });
  });

  it("skips a duplicate Account create", () => {
    const projected = projectPendingLedger(snapshot, [
      accountCommand(
        "account.create",
        {
          id: "cash",
          name: "Replacement",
          type: "cash",
          currency: "USD",
          color: "#111",
          icon: "🏦",
          initialBalanceMinor: 1,
          excludeFromTotal: true,
          sortOrder: 9,
        },
        1,
      ),
    ]);

    expect(projected.accounts.find((row) => row.id === "cash")).toMatchObject({
      name: "Cash",
      version: 0,
    });
  });

  it("patches an Account update and bumps version", () => {
    const projected = projectPendingLedger(snapshot, [
      accountCommand(
        "account.update",
        { accountId: "cash", name: "Daily", visibility: "private" },
        1,
      ),
    ]);

    expect(projected.accounts.find((row) => row.id === "cash")).toMatchObject({
      name: "Daily",
      visibility: "private",
      version: 1,
    });
  });

  it("keeps an archived Account row and skips a later update", () => {
    const projected = projectPendingLedger(snapshot, [
      accountCommand("account.archive", { accountId: "cash" }, 1),
      accountCommand("account.update", { accountId: "cash", name: "Gone" }, 2),
    ]);

    expect(projected.accounts.find((row) => row.id === "cash")).toMatchObject({
      name: "Cash",
      lifecycle: "archived",
      version: 1,
    });
  });

  it("skips archive and update when the Account is missing", () => {
    const projected = projectPendingLedger(snapshot, [
      accountCommand("account.update", { accountId: "missing", name: "Nope" }, 1),
      accountCommand("account.archive", { accountId: "missing" }, 2),
    ]);

    expect(projected.accounts.map((row) => row.id)).toEqual(["cash", "card"]);
  });

  it("lets a later Transaction create land on a pending Account create", () => {
    const projected = projectPendingLedger(snapshot, [
      accountCommand(
        "account.create",
        {
          id: "everyday",
          name: "Everyday",
          type: "bank",
          currency: "AED",
          color: "#4A90D9",
          icon: "🏦",
          initialBalanceMinor: 0,
          excludeFromTotal: false,
          sortOrder: 2,
        },
        1,
      ),
      command(
        "transaction.create",
        {
          id: "first",
          type: "expense",
          amountMinor: 80,
          date: "2026-01-03",
          accountId: "everyday",
        },
        2,
      ),
    ]);

    expect(projected.transactions.find((row) => row.id === "first")).toMatchObject({
      accountId: "everyday",
      currency: "AED",
    });
  });

  it("restores an archived Account and then accepts a later update", async () => {
    const projected = projectPendingLedger(snapshot, [
      accountCommand("account.archive", { accountId: "cash" }, 1),
      accountCommand("account.restore", { accountId: "cash" }, 2),
      accountCommand("account.update", { accountId: "cash", name: "Daily" }, 3),
    ]);

    expect(projected.accounts.find((row) => row.id === "cash")).toMatchObject({
      name: "Daily",
      lifecycle: "active",
      version: 3,
    });
  });

  it("skips Account lifecycle commands that omit accountId", async () => {
    const projected = projectPendingLedger(snapshot, [
      {
        commandId: "bad-restore",
        householdId: HOUSEHOLD_ID,
        kind: "account.restore",
        payload: { id: "cash" },
        issuedAt: timestamp,
        status: "pending",
      },
      {
        commandId: "bad-archive",
        householdId: HOUSEHOLD_ID,
        kind: "account.archive",
        payload: {},
        issuedAt: timestamp,
        status: "pending",
      },
    ]);

    expect(projected.accounts.map((row) => row.id)).toEqual(["cash", "card"]);
    expect(projected.accounts.find((row) => row.id === "cash")).toMatchObject({
      name: "Cash",
      lifecycle: "active",
      version: 0,
    });
  });
});
