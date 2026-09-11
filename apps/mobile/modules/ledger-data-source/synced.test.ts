import { householdLedgerBinding } from "@/modules/ledger-data-source/provider";
import { createSyncedTransactionLedger, type LedgerDependencies } from "@/modules/ledger-db/ledger";
import {
  createTestLedgerCollections,
  preloadTestLedgerCollections,
} from "@/modules/ledger-db/test-collections";
import type {
  PowerSyncAccountRow,
  PowerSyncCategoryRow,
  PowerSyncTransactionRow,
} from "@/modules/ledger-db/types";

import { createSyncedLedgerDataSource } from "./synced";

const HOUSEHOLD_ID = "household-1";
const USER_ID = "user-1";
const TIMESTAMP = "2026-01-01T00:00:00.000Z";

const account: PowerSyncAccountRow = {
  id: "cash",
  ledger_id: HOUSEHOLD_ID,
  household_id: HOUSEHOLD_ID,
  name: "Cash",
  type: "bank",
  currency: "USD",
  color: "#000000",
  icon: "banknote.fill",
  initial_balance_minor: 1000,
  exclude_from_total: 0,
  sort_order: 0,
  lifecycle: "active",
  lifecycle_changed_at: null,
  visibility: "public",
  owner_user_id: USER_ID,
  version: 3,
  created_by: USER_ID,
  updated_by: USER_ID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
};

const category: PowerSyncCategoryRow = {
  id: "groceries",
  ledger_id: HOUSEHOLD_ID,
  household_id: HOUSEHOLD_ID,
  name: "Groceries",
  type: "expense",
  color: "#B48A7B",
  icon: "🛒",
  parent_id: null,
  sort_order: 0,
  lifecycle: "active",
  lifecycle_changed_at: null,
  version: 3,
  created_by: USER_ID,
  updated_by: USER_ID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
};

const transaction: PowerSyncTransactionRow = {
  id: "transaction-1",
  ledger_id: HOUSEHOLD_ID,
  household_id: HOUSEHOLD_ID,
  type: "expense",
  amount_minor: 500,
  currency: "USD",
  original_amount_minor: null,
  original_currency: null,
  exchange_rate: null,
  date: "2026-01-02",
  account_id: account.id,
  to_account_id: null,
  category_id: category.id,
  is_recurring: 0,
  recurring_rule_id: null,
  description: "Groceries",
  version: 1,
  created_by: USER_ID,
  updated_by: USER_ID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
};

const createHarness = async () => {
  const collections = createTestLedgerCollections({
    accounts: [account],
    categories: [category],
    transactions: [transaction],
  });
  await preloadTestLedgerCollections(collections);
  const ids = ["transaction-new", "command-new"];
  const dependencies: LedgerDependencies = {
    binding: householdLedgerBinding(HOUSEHOLD_ID),
    userId: USER_ID,
    dbIdentity: {},
    collections,
    newId: () => {
      const id = ids.shift();
      if (!id) throw new Error("synced source test exhausted generated ids");
      return id;
    },
    now: () => TIMESTAMP,
  };
  const ledger = createSyncedTransactionLedger(dependencies);
  const source = createSyncedLedgerDataSource({
    binding: householdLedgerBinding(HOUSEHOLD_ID),
    userId: USER_ID,
    ledger,
  });
  return { collections, ledger, source };
};

describe("PowerSync synced ledger data source", () => {
  it("reads accounts, categories, balances, and transactions from collections", async () => {
    const { ledger, source } = await createHarness();

    await expect(source.accounts.listWithBalances(false)).resolves.toEqual([
      expect.objectContaining({ id: account.id, balance: 500 }),
    ]);
    await expect(source.categories.list("expense")).resolves.toEqual([
      expect.objectContaining({ id: category.id, name: "Groceries" }),
    ]);
    await expect(source.transactions.list({})).resolves.toEqual([
      expect.objectContaining({ id: transaction.id, amount: 500 }),
    ]);
    ledger.dispose();
  });

  it("writes Account mutations with a full command envelope in metadata", async () => {
    const { collections, ledger, source } = await createHarness();
    const update = jest.spyOn(collections.accounts, "update");

    await source.accounts.update(account.id, { name: "Daily" });

    expect(update).toHaveBeenCalledWith(
      account.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          storageVersion: 1,
          envelope: expect.objectContaining({
            kind: "account.update",
            scope: { type: "organization", organizationId: HOUSEHOLD_ID },
            payload: { accountId: account.id, name: "Daily" },
            preconditions: [{ entityId: account.id, expectedVersion: 3 }],
          }),
        }),
      }),
      expect.any(Function),
    );
    expect(collections.accounts.get(account.id)).toMatchObject({
      name: "Daily",
      visibility: "public",
      version: 4,
    });
    ledger.dispose();
  });

  it("does not optimistically hide a Household Account from other members", async () => {
    const { collections, ledger, source } = await createHarness();
    const update = jest.spyOn(collections.accounts, "update");

    await expect(source.accounts.update(account.id, { visibility: "private" })).rejects.toThrow(
      /Household Accounts are shared/,
    );
    expect(update).not.toHaveBeenCalled();
    expect(collections.accounts.get(account.id)).toMatchObject({ visibility: "public" });
    ledger.dispose();
  });

  it("writes Category mutations through the collection without an outbox", async () => {
    const { collections, ledger, source } = await createHarness();
    const update = jest.spyOn(collections.categories, "update");

    await source.categories.archive(category.id);

    expect(update.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          envelope: expect.objectContaining({
            kind: "category.archive",
            preconditions: [{ entityId: category.id, expectedVersion: 3 }],
          }),
        }),
      }),
    );
    expect(collections.categories.get(category.id)).toMatchObject({
      lifecycle: "archived",
      version: 4,
    });
    ledger.dispose();
  });

  it("delegates Transaction writes to the metadata-bearing PowerSync ledger", async () => {
    const { collections, ledger, source } = await createHarness();

    const id = await source.transactions.create({
      type: "expense",
      amount: 250,
      currency: "USD",
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      date: "2026-01-03",
      accountId: account.id,
      toAccountId: null,
      categoryId: category.id,
      description: "Coffee",
      isRecurring: false,
      recurringRuleId: null,
    });

    expect(id).toBe("transaction-new");
    expect(collections.transactions.get(id)).toMatchObject({
      amount_minor: 250,
      description: "Coffee",
    });
    ledger.dispose();
  });
});
