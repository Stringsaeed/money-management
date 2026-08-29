import type { CommandEnvelope } from "@trove/protocol";

import { createSyncedTransactionResource } from "./synced-transactions";
import type { SyncedTransaction } from "./synced-mappers";
import type { SyncedTransactionSnapshot } from "./synced-transaction-snapshot";

const snapshot: SyncedTransactionSnapshot = {
  householdId: "household-1",
  userId: "user-1",
  accounts: [],
  categories: [],
  transactions: [],
};

const makeTransaction = (id: string): SyncedTransaction => ({
  householdId: "household-1",
  id,
  type: "income",
  amountMinor: 100,
  currency: "USD",
  originalAmountMinor: null,
  originalCurrency: null,
  exchangeRate: null,
  date: "2026-01-01",
  accountId: "cash",
  toAccountId: null,
  categoryId: "income",
  isRecurring: false,
  recurringRuleId: null,
  description: id,
  version: 0,
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});
describe("createSyncedTransactionResource mutations", () => {
  it("enqueues all five Transaction command kinds and preserves optimistic identity", async () => {
    const commands: CommandEnvelope[] = [];
    const cachedSnapshot = {
      ...snapshot,
      transactions: [makeTransaction("transaction-existing")],
    };
    const resource = createSyncedTransactionResource({
      householdId: "household-1",
      readSnapshot: async () => snapshot,
      readCachedSnapshot: async () => cachedSnapshot,
      executeCommand: async (_operation, command) => {
        commands.push(command);
      },
    });

    const createdId = await resource.create({
      type: "expense",
      amount: 100,
      currency: "USD",
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      date: "2026-01-01",
      accountId: "cash",
      toAccountId: null,
      categoryId: "food",
      description: "Lunch",
      recurringRuleId: null,
    });
    await resource.update("transaction-existing", {
      amount: 125,
      currency: "USD",
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      isRecurring: false,
      recurringRuleId: null,
    });
    await resource.delete("transaction-existing");
    const paymentId = await resource.recordCardPayment({
      cardAccountId: "card",
      fundingAccountId: "cash",
      currency: "USD",
      amountMinor: 200,
      budgetPeriod: "2026-01",
    });
    const refundId = await resource.linkRefund({
      originalTransactionId: createdId,
      depositAccountId: "cash",
      currency: "USD",
      amountMinor: 50,
      date: "2026-01-04",
    });

    expect(commands.map((command) => command.kind)).toEqual([
      "transaction.create",
      "transaction.edit",
      "transaction.remove",
      "card_payment.record",
      "refund.link",
    ]);
    expect(commands[0].payload).toMatchObject({ id: createdId });
    expect(commands[1].payload).toEqual({
      transactionId: "transaction-existing",
      amountMinor: 125,
    });
    expect(commands[1].preconditions).toEqual([
      { entityId: "transaction-existing", expectedVersion: 0 },
    ]);
    expect(commands[3].payload).toMatchObject({ transactionId: paymentId });
    expect(commands[4].payload).toMatchObject({ transactionId: refundId });
  });

  it("refuses edit and remove when the authorized version is unavailable", async () => {
    const executeCommand = jest.fn();
    const resource = createSyncedTransactionResource({
      householdId: "household-1",
      readSnapshot: async () => snapshot,
      readCachedSnapshot: async () => snapshot,
      executeCommand,
    });

    await expect(resource.update("missing", { amount: 125 })).rejects.toThrow(
      "not in the authorized ledger snapshot",
    );
    await expect(resource.delete("missing")).rejects.toThrow(
      "not in the authorized ledger snapshot",
    );
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it("carries the composite cursor across rows that share a date", async () => {
    const pageSnapshot: SyncedTransactionSnapshot = {
      ...snapshot,
      transactions: [
        makeTransaction("transaction-c"),
        makeTransaction("transaction-b"),
        makeTransaction("transaction-a"),
      ],
    };
    const resource = createSyncedTransactionResource({
      householdId: "household-1",
      readSnapshot: async () => pageSnapshot,
      readCachedSnapshot: async () => pageSnapshot,
      executeCommand: async () => undefined,
    });

    const first = await resource.page({ limit: 2 });
    if (!first.nextCursor) throw new Error("Expected another Transaction page.");
    const second = await resource.page({
      limit: 2,
      beforeDate: first.nextCursor.date,
      beforeId: first.nextCursor.id,
    });

    expect([...first.transactions, ...second.transactions].map(({ id }) => id)).toEqual([
      "transaction-c",
      "transaction-b",
      "transaction-a",
    ]);
  });
});
