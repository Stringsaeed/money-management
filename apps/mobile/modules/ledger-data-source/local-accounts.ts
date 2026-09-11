import { eq } from "drizzle-orm";

import { accounts } from "@/db/schema";
import { hasVisibleAccount } from "@/hooks/use-account-visibility";
import { updateAccountWithRecurringRules } from "@/modules/account-recurring-coordinator";
import {
  archiveAccount,
  deleteAccount,
  previewAccountArchival,
  previewAccountDeletion,
  restoreAccount,
} from "@/modules/accounts/account-lifecycle";
import { loadAccountBalances } from "@/modules/accounts/account-balance";
import { nowIso, toDateString } from "@/utils/date";
import { generateId } from "@/utils/id";
import type { Account } from "@/types";

import type { AccountUpdate, LedgerOperationRunner, NewAccount } from "./contract";
import type {
  LocalDatabaseDependency,
  LocalSQLiteDependency,
  LocalVisibilityDependency,
} from "./local-types";

export const createLocalAccountPort = (
  {
    db,
    sqlite,
    visibility,
  }: LocalDatabaseDependency & LocalSQLiteDependency & LocalVisibilityDependency,
  runner: LedgerOperationRunner,
) => ({
  reads: {
    accounts: () =>
      runner.run("read.accounts", async () => {
        const rows = (await db
          .select()
          .from(accounts)
          .where(eq(accounts.lifecycle, "active"))
          .orderBy(accounts.sortOrder, accounts.createdAt)
          .all()) as Account[];
        return rows.filter((account) => hasVisibleAccount(visibility, account.id));
      }),
    account: (id: string) =>
      runner.run("read.account", async () => {
        if (!hasVisibleAccount(visibility, id)) {
          return undefined;
        }
        const row = await db.select().from(accounts).where(eq(accounts.id, id)).get();
        // SAFETY: accounts columns match Account; drizzle widens enum columns to string.
        return row as Account | undefined;
      }),
    accountBalances: (includeArchived: boolean) =>
      runner.run("read.account-balances", async () => {
        const rows = await loadAccountBalances(sqlite, includeArchived);
        return rows.filter((account) => hasVisibleAccount(visibility, account.id));
      }),
    archivalPreview: (id: string, localDate: string) =>
      runner.run("read.account-archival-preview", () =>
        previewAccountArchival(sqlite, id, localDate),
      ),
    deletionPreview: (id: string) =>
      runner.run("read.account-deletion-preview", () => previewAccountDeletion(sqlite, id)),
  },
  mutations: {
    createAccount: (data: NewAccount) =>
      runner.run("mutation.account-create", async () => {
        const now = nowIso();
        const id = generateId();
        await db.insert(accounts).values({
          ...data,
          id,
          lifecycle: "active",
          lifecycleChangedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        return id;
      }),
    updateAccount: (id: string, data: AccountUpdate) =>
      runner.run("mutation.account-update", () => {
        const changes = data;
        return updateAccountWithRecurringRules(sqlite, {
          accountId: id,
          changes,
          now: nowIso(),
        });
      }),
    archiveAccount: (id: string) =>
      runner.run("mutation.account-archive", () => {
        const archivedAt = new Date(nowIso());
        return archiveAccount(sqlite, {
          accountId: id,
          localDate: toDateString(archivedAt),
          now: archivedAt.toISOString(),
        });
      }),
    restoreAccount: (id: string) =>
      runner.run("mutation.account-restore", () =>
        restoreAccount(sqlite, { accountId: id, now: nowIso() }),
      ),
    deleteAccount: (id: string) =>
      runner.run("mutation.account-delete", () => deleteAccount(sqlite, id)),
  },
});
