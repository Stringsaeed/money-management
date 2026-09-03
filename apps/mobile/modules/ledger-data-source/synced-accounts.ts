import type { CommandEnvelope } from "@trove/protocol";

import { generateId } from "@/utils/id";

import {
  unsupportedSyncedOperation,
  type LedgerAccountPolicy,
  type LedgerAccountPrivacy,
  type LedgerAccountResource,
  type LedgerDataSourceOperation,
} from "./contract";
import {
  assertSupportedAccountUpdate,
  calculateSyncedBalance,
  mapSyncedAccount,
  mapSyncedAccountPrivacy,
  toSyncedAccountType,
  type SyncedAccount,
} from "./synced-mappers";
import type { SyncedTransactionSnapshot } from "./synced-transaction-snapshot";

interface SyncedAccountSurface {
  readonly accounts: LedgerAccountResource;
  readonly accountPrivacy: Extract<LedgerAccountPrivacy, { kind: "synced" }>;
}

interface SyncedAccountDependencies {
  householdId: string;
  userId: string;
  readSnapshot: () => Promise<SyncedTransactionSnapshot>;
  readCachedSnapshot: () => Promise<SyncedTransactionSnapshot>;
  enqueue: (operation: LedgerDataSourceOperation, command: CommandEnvelope) => Promise<void>;
}

export const SYNCED_ACCOUNT_POLICY: LedgerAccountPolicy = {
  immutableFields: new Set(["type", "currency", "initialBalance"]),
};

export const createSyncedAccountResource = ({
  householdId,
  userId,
  readSnapshot,
  readCachedSnapshot,
  enqueue,
}: SyncedAccountDependencies): SyncedAccountSurface => {
  const listProjectedAccounts = async (includeArchived: boolean) => {
    const snapshot = await readSnapshot();
    return snapshot.accounts
      .filter((row) => includeArchived || row.lifecycle === "active")
      .map(mapSyncedAccount);
  };

  const accounts: LedgerAccountResource = {
    list: () => listProjectedAccounts(false),
    get: async (id) => (await listProjectedAccounts(true)).find((account) => account.id === id),
    listWithBalances: async (includeArchived) => {
      const snapshot = await readSnapshot();
      return snapshot.accounts
        .map(mapSyncedAccount)
        .filter((account) => includeArchived || account.lifecycle === "active")
        .map((account) => ({
          ...account,
          balance: calculateSyncedBalance(account, snapshot.transactions),
        }));
    },
    create: async (data) => {
      const id = generateId();
      await enqueue("mutation.account-create", {
        commandId: generateId(),
        householdId,
        kind: "account.create",
        issuedAt: new Date().toISOString(),
        payload: {
          id,
          name: data.name,
          type: toSyncedAccountType(data.type),
          currency: data.currency,
          color: data.color,
          icon: data.icon,
          initialBalanceMinor: data.initialBalance,
          excludeFromTotal: data.excludeFromTotal,
          sortOrder: data.sortOrder,
        },
      });
      return id;
    },
    update: async (id, data) => {
      assertSupportedAccountUpdate(data);
      const expectedVersion = (await findCachedAccount(readCachedSnapshot, id)).version;
      return enqueue("mutation.account-update", {
        commandId: generateId(),
        householdId,
        kind: "account.update",
        issuedAt: new Date().toISOString(),
        payload: {
          accountId: id,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.excludeFromTotal !== undefined && { excludeFromTotal: data.excludeFromTotal }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.visibility !== undefined && { visibility: data.visibility }),
        },
        preconditions: [{ entityId: id, expectedVersion }],
      });
    },
    archive: async (id) => {
      const account = await findCachedAccount(readCachedSnapshot, id);
      if (account.lifecycle === "archived") {
        return;
      }
      return enqueue("mutation.account-archive", {
        commandId: generateId(),
        householdId,
        kind: "account.archive",
        issuedAt: new Date().toISOString(),
        payload: { accountId: id },
        preconditions: [{ entityId: id, expectedVersion: account.version }],
      });
    },
    restore: async (id) => {
      const account = await findCachedAccount(readCachedSnapshot, id);
      if (account.lifecycle === "active") {
        return;
      }
      return enqueue("mutation.account-restore", {
        commandId: generateId(),
        householdId,
        kind: "account.restore",
        issuedAt: new Date().toISOString(),
        payload: { accountId: id },
        preconditions: [{ entityId: id, expectedVersion: account.version }],
      });
    },
    policy: SYNCED_ACCOUNT_POLICY,
  };

  return {
    accounts,
    accountPrivacy: {
      kind: "synced",
      read: async (id) => {
        const row = (await readSnapshot()).accounts.find((account) => account.id === id);
        return row ? mapSyncedAccountPrivacy(row, userId) : undefined;
      },
      set: async (id, visibility) => {
        const row = await findCachedAccount(readCachedSnapshot, id);
        if (row.ownerUserId !== userId) {
          throw unsupportedSyncedOperation(
            "Privacy change",
            "Visibility is unchanged.",
            "Only the Account owner can change this.",
          );
        }
        return enqueue("mutation.account-privacy", {
          commandId: generateId(),
          householdId,
          kind: "account.update",
          issuedAt: new Date().toISOString(),
          payload: { accountId: id, visibility },
          preconditions: [{ entityId: id, expectedVersion: row.version }],
        });
      },
    },
  };
};

const findCachedAccount = async (
  readCachedSnapshot: () => Promise<SyncedTransactionSnapshot>,
  id: string,
): Promise<SyncedAccount> => {
  const account = (await readCachedSnapshot()).accounts.find((row) => row.id === id);
  if (!account) {
    throw new Error(
      "This Account is not in the authorized ledger snapshot. Refresh the ledger before editing it.",
    );
  }
  return account;
};
