import type { CommandEnvelope } from "@trove/protocol";

import { toLedgerTransactionResource } from "@/modules/ledger-db/compat";
import type { SyncedTransactionLedger } from "@/modules/ledger-db/ledger";
import { commandMetadataFor } from "@/modules/powersync/command-metadata";
import type { Account } from "@/types";
import { nowIso } from "@/utils/date";
import { generateId } from "@/utils/id";

import {
  createLedgerOperationRunner,
  type LedgerAccountDataSource,
  type LedgerCategoryDataSource,
  type LedgerDataSourceOperation,
  type LedgerOfflineState,
  type LedgerTransactionDataSource,
} from "./contract";
import type { SyncedLedgerBinding } from "./provider";
import {
  assertSupportedAccountUpdate,
  calculateSyncedBalance,
  mapPowerSyncAccount,
  mapPowerSyncCategory,
  mapPowerSyncTransaction,
  toSyncedAccountType,
} from "./synced-mappers";

export type SyncedLedgerDataSource = LedgerAccountDataSource &
  LedgerCategoryDataSource &
  LedgerTransactionDataSource;

interface CreateSyncedLedgerDataSourceOptions {
  binding: SyncedLedgerBinding;
  userId: string;
  ledger: SyncedTransactionLedger;
  offlineState?: Exclude<LedgerOfflineState, { kind: "offline_ready" }>;
}

export const createSyncedLedgerDataSource = ({
  binding,
  userId,
  ledger,
  offlineState = { kind: "online" },
}: CreateSyncedLedgerDataSourceOptions): SyncedLedgerDataSource => {
  const { ledgerId, householdId, scope } = binding;
  const runner = createLedgerOperationRunner("synced");
  const { accounts, categories, transactions } = ledger.collections;
  const run = <TResult>(operation: LedgerDataSourceOperation, execute: () => Promise<TResult>) =>
    runner.run(operation, execute);

  const accountRows = () => accounts.toArray.filter((row) => row.ledger_id === ledgerId);
  const categoryRows = () => categories.toArray.filter((row) => row.ledger_id === ledgerId);
  const transactionRows = () =>
    transactions.toArray.filter((row) => row.ledger_id === ledgerId).map(mapPowerSyncTransaction);
  const accountRow = (id: string) => {
    const row = accounts.get(id);
    if (!row || row.ledger_id !== ledgerId) {
      throw new Error("This Account is not in the authorized PowerSync collection.");
    }
    return row;
  };
  const categoryRow = (id: string) => {
    const row = categories.get(id);
    if (!row || row.ledger_id !== ledgerId) {
      throw new Error("This Category is not in the authorized PowerSync collection.");
    }
    return row;
  };
  const persist = async (transaction: { isPersisted: { promise: Promise<unknown> } }) => {
    await transaction.isPersisted.promise;
  };
  const timestamped = (command: Omit<CommandEnvelope, "issuedAt">): CommandEnvelope => ({
    ...command,
    issuedAt: nowIso(),
  });

  const listAccounts = async (includeArchived: boolean): Promise<Account[]> =>
    accountRows()
      .filter((row) => includeArchived || row.lifecycle === "active")
      .map(mapPowerSyncAccount);
  const listCategories = async (type?: "income" | "expense", includeArchived = false) =>
    categoryRows()
      .filter(
        (row) =>
          (includeArchived || row.lifecycle === "active") &&
          (type === undefined || row.type === type),
      )
      .map(mapPowerSyncCategory);

  return {
    source: "synced",
    cacheKey: "synced:" + ledgerId + ":" + userId,
    offlineState,
    accounts: {
      list: () => run("read.accounts", () => listAccounts(false)),
      get: (id) =>
        run("read.accounts", async () =>
          (await listAccounts(true)).find((account) => account.id === id),
        ),
      listWithBalances: (includeArchived) =>
        run("read.accounts", async () =>
          (await listAccounts(includeArchived)).map((account) => ({
            ...account,
            balance: calculateSyncedBalance(account, transactionRows()),
          })),
        ),
      create: (data) =>
        run("mutation.account-create", async () => {
          const id = generateId();
          const issuedAt = nowIso();
          const command: CommandEnvelope = {
            commandId: generateId(),
            scope,
            kind: "account.create",
            issuedAt,
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
          };
          await persist(
            accounts.insert(
              {
                id,
                ledger_id: ledgerId,
                household_id: householdId,
                name: data.name,
                type: toSyncedAccountType(data.type),
                currency: data.currency,
                color: data.color,
                icon: data.icon,
                initial_balance_minor: data.initialBalance,
                exclude_from_total: data.excludeFromTotal ? 1 : 0,
                sort_order: data.sortOrder,
                lifecycle: "active",
                lifecycle_changed_at: null,
                visibility: "public",
                owner_user_id: userId,
                version: 0,
                created_by: userId,
                updated_by: userId,
                created_at: issuedAt,
                updated_at: issuedAt,
              },
              { metadata: commandMetadataFor(command) },
            ),
          );
          return id;
        }),
      update: (id, data) =>
        run("mutation.account-update", async () => {
          assertSupportedAccountUpdate(data);
          const current = accountRow(id);
          const command = timestamped({
            commandId: generateId(),
            scope,
            kind: "account.update",
            payload: {
              accountId: id,
              ...(data.name !== undefined && { name: data.name }),
              ...(data.color !== undefined && { color: data.color }),
              ...(data.icon !== undefined && { icon: data.icon }),
              ...(data.excludeFromTotal !== undefined && {
                excludeFromTotal: data.excludeFromTotal,
              }),
              ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
              ...(data.visibility !== undefined && { visibility: data.visibility }),
            },
            preconditions: [{ entityId: id, expectedVersion: current.version }],
          });
          await persist(
            accounts.update(id, { metadata: commandMetadataFor(command) }, (draft) => {
              if (data.name !== undefined) draft.name = data.name;
              if (data.color !== undefined) draft.color = data.color;
              if (data.icon !== undefined) draft.icon = data.icon;
              if (data.excludeFromTotal !== undefined) {
                draft.exclude_from_total = data.excludeFromTotal ? 1 : 0;
              }
              if (data.sortOrder !== undefined) draft.sort_order = data.sortOrder;
              if (data.visibility !== undefined) draft.visibility = data.visibility;
              draft.version = current.version + 1;
              draft.updated_by = userId;
              draft.updated_at = command.issuedAt ?? nowIso();
            }),
          );
        }),
      archive: (id) =>
        run("mutation.account-archive", async () => {
          const current = accountRow(id);
          if (current.lifecycle === "archived") return;
          const command = timestamped({
            commandId: generateId(),
            scope,
            kind: "account.archive",
            payload: { accountId: id },
            preconditions: [{ entityId: id, expectedVersion: current.version }],
          });
          await persist(
            accounts.update(id, { metadata: commandMetadataFor(command) }, (draft) => {
              draft.lifecycle = "archived";
              draft.lifecycle_changed_at = command.issuedAt ?? nowIso();
              draft.version = current.version + 1;
              draft.updated_by = userId;
              draft.updated_at = command.issuedAt ?? nowIso();
            }),
          );
        }),
    },
    accountLifecycle: { kind: "synced" },
    categories: {
      list: (type, includeArchived = false) =>
        run("read.categories", () => listCategories(type, includeArchived)),
      get: (id) =>
        run("read.categories", async () =>
          (await listCategories(undefined, true)).find((category) => category.id === id),
        ),
      create: (data) =>
        run("mutation.category-create", async () => {
          const id = generateId();
          const issuedAt = nowIso();
          const command: CommandEnvelope = {
            commandId: generateId(),
            scope,
            kind: "category.create",
            issuedAt,
            payload: {
              id,
              name: data.name,
              type: data.type,
              color: data.color,
              icon: data.icon,
              parentId: data.parentId ?? null,
              sortOrder: data.sortOrder,
            },
          };
          await persist(
            categories.insert(
              {
                id,
                ledger_id: ledgerId,
                household_id: householdId,
                name: data.name,
                type: data.type,
                color: data.color,
                icon: data.icon,
                parent_id: data.parentId ?? null,
                sort_order: data.sortOrder,
                lifecycle: "active",
                lifecycle_changed_at: null,
                version: 0,
                created_by: userId,
                updated_by: userId,
                created_at: issuedAt,
                updated_at: issuedAt,
              },
              { metadata: commandMetadataFor(command) },
            ),
          );
          return id;
        }),
      update: (id, data) =>
        run("mutation.category-update", async () => {
          const current = categoryRow(id);
          const command = timestamped({
            commandId: generateId(),
            scope,
            kind: "category.update",
            payload: {
              categoryId: id,
              ...(data.name !== undefined && { name: data.name }),
              ...(data.color !== undefined && { color: data.color }),
              ...(data.icon !== undefined && { icon: data.icon }),
              ...(data.parentId !== undefined && { parentId: data.parentId }),
              ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            },
            preconditions: [{ entityId: id, expectedVersion: current.version }],
          });
          await persist(
            categories.update(id, { metadata: commandMetadataFor(command) }, (draft) => {
              if (data.name !== undefined) draft.name = data.name;
              if (data.color !== undefined) draft.color = data.color;
              if (data.icon !== undefined) draft.icon = data.icon;
              if (data.parentId !== undefined) draft.parent_id = data.parentId;
              if (data.sortOrder !== undefined) draft.sort_order = data.sortOrder;
              draft.version = current.version + 1;
              draft.updated_by = userId;
              draft.updated_at = command.issuedAt ?? nowIso();
            }),
          );
        }),
      archive: (id) =>
        run("mutation.category-archive", async () => {
          const current = categoryRow(id);
          if (current.lifecycle === "archived") return;
          const command = timestamped({
            commandId: generateId(),
            scope,
            kind: "category.archive",
            payload: { categoryId: id },
            preconditions: [{ entityId: id, expectedVersion: current.version }],
          });
          await persist(
            categories.update(id, { metadata: commandMetadataFor(command) }, (draft) => {
              draft.lifecycle = "archived";
              draft.lifecycle_changed_at = command.issuedAt ?? nowIso();
              draft.version = current.version + 1;
              draft.updated_by = userId;
              draft.updated_at = command.issuedAt ?? nowIso();
            }),
          );
        }),
    },
    categoryLifecycle: { kind: "synced" },
    transactions: toLedgerTransactionResource(ledger),
    observeErrors: runner.observeErrors,
  };
};
