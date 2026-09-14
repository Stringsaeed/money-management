import {
  householdLedgerBinding,
  personalLedgerBinding,
  type SyncedLedgerBinding,
} from "@/modules/ledger-data-source/provider";
import {
  mintCreate,
  mintEdit,
  mintPowerSyncCreate,
  mintRefund,
  mintRemove,
  type MintContext,
} from "../intents";
import type { LedgerTransaction } from "../types";

const ids = (
  values: string[],
  binding: SyncedLedgerBinding = householdLedgerBinding("household-1"),
): MintContext => {
  const queue = [...values];
  return {
    binding,
    newId: () => {
      const next = queue.shift();
      if (!next) throw new Error("mint test ran out of ids");
      return next;
    },
    now: () => "2026-03-01T12:00:00.000Z",
  };
};

const projectedRow = (version: number): LedgerTransaction => ({
  id: "txn-projected",
  type: "expense",
  amount: 500,
  currency: "USD",
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  date: "2026-01-02",
  accountId: "cash",
  toAccountId: null,
  categoryId: "groceries",
  isRecurring: false,
  recurringRuleId: null,
  description: "Groceries",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  account: { id: "cash", name: "Cash", color: "#000", icon: "banknote.fill", currency: "USD" },
  toAccount: null,
  category: { id: "groceries", name: "Groceries", color: "#B48A7B", icon: "🛒" },
  version,
  sync: { kind: "pending", commandIds: ["cmd-prior"] },
});

describe("intents", () => {
  it("returns an IntentReceipt whose id is not the commandId", () => {
    const created = mintCreate(ids(["txn-new", "cmd-new"]), {
      type: "expense",
      amount: 1250,
      date: "2026-03-01",
      accountId: "cash",
      categoryId: "groceries",
      description: "Lunch",
    });
    expect(created.receipt.id).toBe("txn-new");
    expect(created.receipt.commandId).toBe("cmd-new");
    expect(created.receipt.id).not.toBe(created.receipt.commandId);
    expect(created.command.commandId).toBe(created.receipt.commandId);
    expect(created.command.payload).toMatchObject({ id: "txn-new", amountMinor: 1250 });
  });

  it("takes expectedVersion from the projected row", () => {
    const command = mintEdit(ids(["cmd-edit"]), projectedRow(4), {
      amount: 800,
      description: "Adjusted",
    });
    expect(command.preconditions).toEqual([{ entityId: "txn-projected", expectedVersion: 4 }]);
    expect(command.payload).toEqual({
      transactionId: "txn-projected",
      amountMinor: 800,
      description: "Adjusted",
    });

    const remove = mintRemove(ids(["cmd-remove"]), projectedRow(4));
    expect(remove.preconditions).toEqual([{ entityId: "txn-projected", expectedVersion: 4 }]);
  });

  it("mints a refund receipt with a distinct commandId", () => {
    const refunded = mintRefund(ids(["txn-refund", "cmd-refund"]), {
      originalTransactionId: "txn-projected",
      depositAccountId: "cash",
      currency: "USD",
      amount: 200,
      date: "2026-03-02",
    });
    expect(refunded.receipt.id).toBe("txn-refund");
    expect(refunded.receipt.commandId).toBe("cmd-refund");
    expect(refunded.receipt.id).not.toBe(refunded.receipt.commandId);
    expect(refunded.command.payload).toMatchObject({
      transactionId: "txn-refund",
      originalTransactionId: "txn-projected",
      amountMinor: 200,
    });
  });

  it("stamps the binding's scope on every command it mints", () => {
    const personal = personalLedgerBinding("user-1");
    const ctx = ids(["txn-new", "cmd-new"], personal);

    const created = mintCreate(ctx, {
      type: "expense",
      amount: 1250,
      date: "2026-03-01",
      accountId: "cash",
      categoryId: "groceries",
      description: "Lunch",
    });

    expect(created.command.scope).toEqual({ type: "personal" });
    expect(created.command.householdId).toBeUndefined();

    const organization = mintCreate(ids(["txn-org", "cmd-org"]), {
      type: "expense",
      amount: 1250,
      date: "2026-03-01",
      accountId: "cash",
      categoryId: "groceries",
      description: "Lunch",
    });

    expect(organization.command.scope).toEqual({
      type: "organization",
      organizationId: "household-1",
    });
  });

  it("writes a personal row to the personal ledger with no Household", () => {
    const personal = personalLedgerBinding("user-1");
    const minted = mintPowerSyncCreate(
      {
        ...ids(["txn-new", "cmd-new"], personal),
        userId: "user-1",
        accountCurrency: () => "USD",
      },
      {
        type: "expense",
        amount: 1250,
        date: "2026-03-01",
        accountId: "cash",
        categoryId: "groceries",
        description: "Lunch",
      },
    );

    expect(minted.row.ledger_id).toBe("personal:user-1");
    expect(minted.row.household_id).toBeNull();
  });
});
