import type { CommandEnvelope } from "@trove/protocol";

import type { ProjectableCommand } from "@/lib/sync/outbox";
import type { SyncedAccount, SyncedTransaction } from "@/modules/ledger-data-source/synced-mappers";
import type { SyncedTransactionSnapshot } from "@/modules/ledger-data-source/synced-transaction-snapshot";

import { diffRows, initialState, materialize, reduce, statusOf } from "./store";
import { asCommandId, asSeq, type ConfirmedCommand, type LedgerTransaction } from "./types";

const HOUSEHOLD_ID = "household-1";
const USER_ID = "user-1";
const TIMESTAMP = "2026-01-01T00:00:00.000Z";

const cash: SyncedAccount = {
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
  ownerUserId: USER_ID,
  version: 0,
  createdBy: USER_ID,
  updatedBy: USER_ID,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
};

const groceries = {
  householdId: HOUSEHOLD_ID,
  id: "groceries",
  name: "Groceries",
  type: "expense" as const,
  color: "#B48A7B",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  lifecycle: "active" as const,
  lifecycleChangedAt: null,
  version: 0,
  createdBy: USER_ID,
  updatedBy: USER_ID,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
};

const existingRow = (overrides: Partial<SyncedTransaction> = {}): SyncedTransaction => ({
  householdId: HOUSEHOLD_ID,
  id: "existing",
  type: "expense",
  amountMinor: 500,
  currency: "USD",
  originalAmountMinor: null,
  originalCurrency: null,
  exchangeRate: null,
  date: "2026-01-02",
  accountId: "cash",
  toAccountId: null,
  categoryId: "groceries",
  isRecurring: false,
  recurringRuleId: null,
  description: "Groceries",
  version: 2,
  createdBy: USER_ID,
  updatedBy: USER_ID,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
});

const snapshot = (transactions: readonly SyncedTransaction[] = []): SyncedTransactionSnapshot => ({
  householdId: HOUSEHOLD_ID,
  userId: USER_ID,
  accounts: [cash],
  categories: [groceries],
  transactions: [...transactions],
});

const projectable = (
  envelope: CommandEnvelope,
  status: "pending" | "sending" = "pending",
): ProjectableCommand => ({
  ...envelope,
  status,
});

const createEnvelope = (
  commandId: string,
  transactionId: string,
  amountMinor = 1250,
): CommandEnvelope => ({
  commandId,
  householdId: HOUSEHOLD_ID,
  kind: "transaction.create",
  issuedAt: TIMESTAMP,
  payload: {
    id: transactionId,
    type: "expense",
    amountMinor,
    date: "2026-03-01",
    accountId: "cash",
    categoryId: "groceries",
    description: "Lunch",
  },
});

const editEnvelope = (
  commandId: string,
  transactionId: string,
  amountMinor: number,
): CommandEnvelope => ({
  commandId,
  householdId: HOUSEHOLD_ID,
  kind: "transaction.edit",
  issuedAt: TIMESTAMP,
  payload: { transactionId, amountMinor },
  preconditions: [{ entityId: transactionId, expectedVersion: 2 }],
});

const confirmedOf = (envelope: CommandEnvelope, seq: number): ConfirmedCommand => ({
  commandId: asCommandId(envelope.commandId),
  seq: asSeq(seq),
  command: envelope,
});

const hydrate = (
  state = initialState(HOUSEHOLD_ID, USER_ID),
  transactions: readonly SyncedTransaction[] = [],
  watermark = 0,
) =>
  reduce(state, {
    kind: "hydrated",
    base: { snapshot: snapshot(transactions), watermark: asSeq(watermark) },
  });

const rowById = (rows: readonly LedgerTransaction[], id: string) =>
  rows.find((row) => row.id === id);

describe("ledger store", () => {
  it("dedupes a command that is still pending after it is confirmed", () => {
    const envelope = createEnvelope("cmd-create", "txn-new");
    let state = hydrate();
    state = reduce(state, { kind: "outbox_changed", pending: [projectable(envelope)] });

    const pendingRows = materialize(state);
    expect(pendingRows).toHaveLength(1);
    expect(rowById(pendingRows, "txn-new")?.sync).toEqual({
      kind: "pending",
      commandIds: ["cmd-create"],
    });
    expect(rowById(pendingRows, "txn-new")?.amount).toBe(1250);

    state = reduce(state, { kind: "command_confirmed", confirmed: confirmedOf(envelope, 4) });
    const settledWhileQueued = materialize(state);
    expect(settledWhileQueued).toHaveLength(1);
    expect(rowById(settledWhileQueued, "txn-new")?.sync).toEqual({ kind: "confirmed" });
    expect(rowById(settledWhileQueued, "txn-new")?.amount).toBe(1250);

    state = reduce(state, { kind: "outbox_changed", pending: [] });
    const afterDelete = materialize(state);
    expect(afterDelete).toHaveLength(1);
    expect(rowById(afterDelete, "txn-new")?.sync).toEqual({ kind: "confirmed" });
  });

  it("drops the pending overlay when a rejection leaves the projectable set", () => {
    const envelope = createEnvelope("cmd-reject", "txn-reject");
    let state = hydrate();
    state = reduce(state, { kind: "outbox_changed", pending: [projectable(envelope)] });
    expect(rowById(materialize(state), "txn-reject")?.sync.kind).toBe("pending");

    state = reduce(state, { kind: "outbox_changed", pending: [] });
    expect(materialize(state)).toEqual([]);
    expect(state.confirmed.size).toBe(0);
  });

  it("evicts confirmed commands once the base watermark covers their seq", () => {
    const envelope = editEnvelope("cmd-edit", "existing", 800);
    let state = hydrate(initialState(HOUSEHOLD_ID, USER_ID), [existingRow()], 3);
    state = reduce(state, { kind: "command_confirmed", confirmed: confirmedOf(envelope, 5) });
    expect(rowById(materialize(state), "existing")?.amount).toBe(800);
    expect(rowById(materialize(state), "existing")?.version).toBe(3);
    expect(state.confirmed.has(asCommandId("cmd-edit"))).toBe(true);

    state = reduce(state, {
      kind: "hydrated",
      base: {
        snapshot: snapshot([existingRow({ amountMinor: 800, version: 3 })]),
        watermark: asSeq(5),
      },
    });
    expect(state.confirmed.size).toBe(0);
    expect(rowById(materialize(state), "existing")?.amount).toBe(800);
    expect(rowById(materialize(state), "existing")?.sync).toEqual({ kind: "confirmed" });
  });

  it("ignores a confirm whose seq is already in the hydrated watermark", () => {
    const envelope = createEnvelope("cmd-old", "txn-old");
    let state = hydrate(
      initialState(HOUSEHOLD_ID, USER_ID),
      [existingRow({ id: "txn-old", amountMinor: 1250 })],
      9,
    );
    state = reduce(state, { kind: "command_confirmed", confirmed: confirmedOf(envelope, 9) });
    expect(state.confirmed.size).toBe(0);
    expect(materialize(state)).toHaveLength(1);
  });

  it("treats a second confirm for the same commandId as a no-op", () => {
    const envelope = createEnvelope("cmd-once", "txn-once");
    let state = hydrate();
    state = reduce(state, { kind: "command_confirmed", confirmed: confirmedOf(envelope, 2) });
    const once = state;
    state = reduce(state, { kind: "command_confirmed", confirmed: confirmedOf(envelope, 2) });
    expect(state).toBe(once);
  });

  it("reports status from hydrate, outbox, and offline flags", () => {
    expect(statusOf(initialState(HOUSEHOLD_ID, USER_ID))).toEqual({ phase: "hydrating" });

    let state = reduce(initialState(HOUSEHOLD_ID, USER_ID), { kind: "hydrate_failed" });
    expect(statusOf(state).phase).toBe("unavailable");

    state = hydrate();
    state = reduce(state, {
      kind: "outbox_changed",
      pending: [projectable(createEnvelope("cmd-q", "txn-q"))],
    });
    expect(statusOf(state)).toEqual({ phase: "ready", queuedCommands: 1 });

    state = reduce(state, {
      kind: "command_confirmed",
      confirmed: confirmedOf(createEnvelope("cmd-q", "txn-q"), 1),
    });
    expect(statusOf(state)).toEqual({ phase: "ready", queuedCommands: 0 });

    state = reduce(state, { kind: "offline_changed", offline: true });
    expect(statusOf(state)).toMatchObject({ phase: "ready", stale: "offline" });
  });

  it("diffs rows by transaction id", () => {
    const envelope = createEnvelope("cmd-diff", "txn-diff");
    let state = hydrate();
    state = reduce(state, { kind: "outbox_changed", pending: [projectable(envelope)] });
    const pending = materialize(state);
    state = reduce(state, { kind: "command_confirmed", confirmed: confirmedOf(envelope, 1) });
    state = reduce(state, { kind: "outbox_changed", pending: [] });
    const confirmed = materialize(state);

    expect(diffRows([], pending)).toEqual([{ op: "insert", row: pending[0] }]);
    expect(diffRows(pending, confirmed)).toEqual([{ op: "update", row: confirmed[0] }]);
    expect(diffRows(confirmed, [])).toEqual([{ op: "delete", id: "txn-diff" }]);
  });
});
