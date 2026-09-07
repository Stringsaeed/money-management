import type { LedgerDependencies } from "./ledger";
import { createTestLedgerCollections } from "./test-collections";
import {
  acquireSyncedTransactionLedger,
  peekSyncedTransactionLedger,
  resetLedgerRegistryForTests,
} from "./registry";

interface DbIdentity {
  readonly label: string;
}

const deps = (dbIdentity: DbIdentity): LedgerDependencies => ({
  householdId: "household-1",
  userId: "user-1",
  dbIdentity,
  collections: createTestLedgerCollections(),
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

  it("does not reuse a ledger backed by a different database identity", () => {
    const firstDb = { label: "a" };
    const secondDb = { label: "b" };
    const first = acquireSyncedTransactionLedger(deps(firstDb));
    const second = acquireSyncedTransactionLedger(deps(secondDb));

    expect(second.ledger).not.toBe(first.ledger);
    expect(peekSyncedTransactionLedger("household-1", "user-1")).toBe(second.ledger);

    first.release();
    expect(peekSyncedTransactionLedger("household-1", "user-1")).toBe(second.ledger);
    second.release();
  });
});
