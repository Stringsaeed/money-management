import type { CommandEnvelope, CommandResult } from "@trove/protocol";

import type { ProjectableCommand } from "@/lib/sync/outbox";
import type { SyncedAccount, SyncedTransaction } from "@/modules/ledger-data-source/synced-mappers";
import type { SyncedTransactionSnapshot } from "@/modules/ledger-data-source/synced-transaction-snapshot";

import { createSyncedTransactionLedger, type LedgerDependencies } from "./ledger";
import { resetLedgerRegistryForTests } from "./registry";

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

const snapshot = (transactions: readonly SyncedTransaction[] = []): SyncedTransactionSnapshot => ({
  householdId: HOUSEHOLD_ID,
  userId: USER_ID,
  accounts: [cash],
  categories: [groceries],
  transactions: [...transactions],
});

const createEnvelope = (commandId: string, transactionId: string): CommandEnvelope => ({
  commandId,
  householdId: HOUSEHOLD_ID,
  kind: "transaction.create",
  issuedAt: TIMESTAMP,
  payload: {
    id: transactionId,
    type: "expense",
    amountMinor: 1250,
    date: "2026-03-01",
    accountId: "cash",
    categoryId: "groceries",
    description: "Lunch",
  },
});

const projectable = (envelope: CommandEnvelope): ProjectableCommand => ({
  ...envelope,
  status: "pending",
});

const applied = (transactionId: string, seq: number): CommandResult => ({
  kind: "applied",
  seq,
  effects: ["ledger"],
  applied: { transactionId },
  replayed: false,
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

const createDeps = (
  overrides: Partial<LedgerDependencies> = {},
): LedgerDependencies & {
  notify: (change?: { householdId: string; userId?: string }) => void;
  queued: ProjectableCommand[];
} => {
  const listeners = new Set<(change: { householdId: string; userId?: string }) => void>();
  const queued: ProjectableCommand[] = [];
  return {
    householdId: HOUSEHOLD_ID,
    userId: USER_ID,
    dbIdentity: {},
    fetchAuthoritative: async () => snapshot(),
    readCachedSnapshot: async () => {
      throw new Error("no cache");
    },
    writeCachedSnapshot: async () => undefined,
    readWatermark: async () => 0,
    listQueuedCommands: async () => [...queued],
    enqueue: async () => undefined,
    observeOutbox: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    newId: () => "generated",
    now: () => TIMESTAMP,
    queued,
    notify: (change = { householdId: HOUSEHOLD_ID, userId: USER_ID }) => {
      for (const listener of [...listeners]) listener(change);
    },
    ...overrides,
  };
};

const waitUntil = async (predicate: () => boolean): Promise<void> => {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > 2000) throw new Error("Timed out waiting for ledger state.");
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

const ledgers: { dispose: () => void }[] = [];

afterEach(() => {
  ledgers.splice(0).forEach((ledger) => ledger.dispose());
  resetLedgerRegistryForTests();
});

describe("SyncedTransactionLedger", () => {
  it("settles an applied create into the confirmed collection without dropping the row", async () => {
    const deps = createDeps({ readCachedSnapshot: async () => snapshot() });
    const envelope = createEnvelope("cmd-create", "txn-new");
    const ledger = createSyncedTransactionLedger(deps);
    ledgers.push(ledger);
    await ledger.refresh();

    deps.queued.push(projectable(envelope));
    deps.notify();
    await waitUntil(() => ledger.rows().some((row) => row.id === "txn-new"));
    expect(ledger.rows()[0]?.sync).toEqual({ kind: "pending", commandIds: ["cmd-create"] });

    ledger.settle(envelope, applied("txn-new", 4));
    expect(ledger.rows()[0]?.sync).toEqual({ kind: "confirmed" });
    expect(ledger.rows()[0]?.amount).toBe(1250);

    deps.queued.splice(0);
    deps.notify();
    await waitUntil(() => ledger.rows()[0]?.sync.kind === "confirmed");
    expect(ledger.rows()).toHaveLength(1);
    expect(ledger.status()).toMatchObject({ phase: "ready", queuedCommands: 0 });
  });

  it("drops the optimistic overlay on typed rejection and leaves confirmed empty", async () => {
    const deps = createDeps({ readCachedSnapshot: async () => snapshot() });
    const envelope = createEnvelope("cmd-reject", "txn-reject");
    const ledger = createSyncedTransactionLedger(deps);
    ledgers.push(ledger);
    await ledger.refresh();

    deps.queued.push(projectable(envelope));
    deps.notify();
    await waitUntil(() => ledger.rows().some((row) => row.id === "txn-reject"));

    ledger.settle(envelope, {
      kind: "stale_version",
      entityId: "txn-reject",
      expectedVersion: 1,
      actualVersion: 2,
    });
    expect(ledger.rows()[0]?.sync.kind).toBe("pending");

    deps.queued.splice(0);
    deps.notify();
    await waitUntil(() => ledger.rows().length === 0);
    expect(ledger.rows()).toEqual([]);
    expect(ledger.status()).toMatchObject({ phase: "ready", queuedCommands: 0 });
  });

  it("publishes cached rows plus pending overlay before the network refresh resolves", async () => {
    const fetch = deferred<SyncedTransactionSnapshot>();
    const envelope = createEnvelope("cmd-cold", "txn-cold");
    const deps = createDeps({
      readCachedSnapshot: async () => snapshot(),
      fetchAuthoritative: () => fetch.promise,
      listQueuedCommands: async () => [projectable(envelope)],
    });
    const ledger = createSyncedTransactionLedger(deps);
    ledgers.push(ledger);

    await waitUntil(() => ledger.rows().some((row) => row.id === "txn-cold"));
    expect(ledger.rows()[0]?.sync).toEqual({ kind: "pending", commandIds: ["cmd-cold"] });
    expect(ledger.status().phase).toBe("ready");

    fetch.resolve(snapshot());
    await ledger.refresh();
    expect(ledger.rows().some((row) => row.id === "txn-cold")).toBe(true);
  });

  it("ignores own seq on remote changes and refreshes foreign ledger tags", async () => {
    const fetches: number[] = [];
    const deps = createDeps({
      readCachedSnapshot: async () => snapshot(),
      fetchAuthoritative: async () => {
        fetches.push(1);
        return snapshot();
      },
    });
    const envelope = createEnvelope("cmd-own", "txn-own");
    const ledger = createSyncedTransactionLedger(deps);
    ledgers.push(ledger);
    await ledger.refresh();
    const afterBoot = fetches.length;

    ledger.settle(envelope, applied("txn-own", 9));
    ledger.noteRemoteChanges([{ seq: 9, effects: ["ledger"] }]);
    expect(fetches).toHaveLength(afterBoot);

    ledger.noteRemoteChanges([{ seq: 10, effects: ["ledger"] }]);
    await waitUntil(() => fetches.length > afterBoot);
    expect(fetches.length).toBeGreaterThan(afterBoot);
  });

  it("ignores outbox events for other households", async () => {
    const deps = createDeps({ readCachedSnapshot: async () => snapshot() });
    const envelope = createEnvelope("cmd-scoped", "txn-scoped");
    const ledger = createSyncedTransactionLedger(deps);
    ledgers.push(ledger);
    await ledger.refresh();

    deps.queued.push(projectable(envelope));
    deps.notify({ householdId: "household-2", userId: USER_ID });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(ledger.rows()).toEqual([]);
  });
});
