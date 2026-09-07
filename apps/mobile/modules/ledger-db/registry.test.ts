import type { ProjectableCommand } from "@/lib/sync/outbox";

import type { LedgerDependencies } from "./ledger";
import {
  acquireSyncedTransactionLedger,
  peekSyncedTransactionLedger,
  resetLedgerRegistryForTests,
} from "./registry";

const unused = async (): Promise<never> => {
  throw new Error("registry test does not hydrate");
};

interface DbIdentity {
  readonly label: string;
}

const deps = (dbIdentity: DbIdentity): LedgerDependencies => ({
  householdId: "household-1",
  userId: "user-1",
  dbIdentity,
  fetchAuthoritative: unused,
  readCachedSnapshot: unused,
  writeCachedSnapshot: async () => undefined,
  readWatermark: async () => 0,
  listQueuedCommands: async () => [] as const satisfies readonly ProjectableCommand[],
  enqueue: async () => undefined,
  observeOutbox: () => () => undefined,
  newId: () => "id",
  now: () => "2026-01-01T00:00:00.000Z",
});

afterEach(() => {
  resetLedgerRegistryForTests();
});

describe("ledger registry", () => {
  it("reuses one instance per household and user", () => {
    const db = { label: "one" };
    const first = acquireSyncedTransactionLedger(deps(db));
    const second = acquireSyncedTransactionLedger(deps(db));
    expect(first.ledger).toBe(second.ledger);

    second.release();
    expect(peekSyncedTransactionLedger("household-1", "user-1")).toBe(first.ledger);
    first.release();
    expect(peekSyncedTransactionLedger("household-1", "user-1")).toBeNull();
  });

  it("keeps the instance when a second drizzle wrapper acquires the same household", () => {
    const first = acquireSyncedTransactionLedger(deps({ label: "a" }));
    const second = acquireSyncedTransactionLedger(deps({ label: "b" }));
    expect(second.ledger).toBe(first.ledger);
    second.release();
    expect(peekSyncedTransactionLedger("household-1", "user-1")).toBe(first.ledger);
    first.release();
  });
});
