import {
  createSyncedTransactionLedger,
  type LedgerDependencies,
  type SyncedTransactionLedger,
} from "./ledger";

interface RegistryEntry {
  readonly dbIdentity: object;
  readonly ledger: SyncedTransactionLedger;
  refs: number;
}

const entries = new Map<string, RegistryEntry>();

const scopeKey = (ledgerId: string, userId: string): string => `${ledgerId}\0${userId}`;

export interface AcquiredLedger {
  readonly ledger: SyncedTransactionLedger;
  readonly release: () => void;
}

export const acquireSyncedTransactionLedger = (deps: LedgerDependencies): AcquiredLedger => {
  const key = scopeKey(deps.binding.ledgerId, deps.userId);
  const existing = entries.get(key);
  if (existing?.dbIdentity === deps.dbIdentity) {
    existing.refs += 1;
    return { ledger: existing.ledger, release: () => releaseKey(key, existing.ledger) };
  }
  existing?.ledger.dispose();
  const ledger = createSyncedTransactionLedger(deps);
  entries.set(key, { dbIdentity: deps.dbIdentity, ledger, refs: 1 });
  return { ledger, release: () => releaseKey(key, ledger) };
};

export const peekSyncedTransactionLedger = (
  ledgerId: string,
  userId: string,
): SyncedTransactionLedger | null => entries.get(scopeKey(ledgerId, userId))?.ledger ?? null;

export const resetLedgerRegistryForTests = (): void => {
  for (const entry of entries.values()) entry.ledger.dispose();
  entries.clear();
};

const releaseKey = (key: string, ledger: SyncedTransactionLedger): void => {
  const entry = entries.get(key);
  if (!entry || entry.ledger !== ledger) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  entry.ledger.dispose();
  entries.delete(key);
};
