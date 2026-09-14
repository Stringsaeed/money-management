import { householdLedgerBinding } from "@/modules/ledger-data-source/provider";
import { createSyncedTransactionLedger, type LedgerDependencies } from "../ledger";
import { createTestLedgerCollections, preloadTestLedgerCollections } from "../test-collections";
import type { PowerSyncAccountRow, PowerSyncCategoryRow, PowerSyncTransactionRow } from "../types";

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
  initial_balance_minor: 0,
  exclude_from_total: 0,
  sort_order: 0,
  lifecycle: "active",
  lifecycle_changed_at: null,
  owner_user_id: USER_ID,
  version: 0,
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
  version: 0,
  created_by: USER_ID,
  updated_by: USER_ID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
};

const transaction: PowerSyncTransactionRow = {
  id: "transaction-existing",
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
  version: 2,
  created_by: USER_ID,
  updated_by: USER_ID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
};

const createHarness = async (transactions: PowerSyncTransactionRow[] = []) => {
  const collections = createTestLedgerCollections({
    accounts: [account],
    categories: [category],
    transactions,
  });
  await preloadTestLedgerCollections(collections);
  const ids = [
    "transaction-new",
    "command-create",
    "command-edit",
    "command-remove",
    "transaction-refund",
    "command-refund",
  ];
  const dependencies: LedgerDependencies = {
    binding: householdLedgerBinding(HOUSEHOLD_ID),
    userId: USER_ID,
    dbIdentity: {},
    collections,
    newId: () => {
      const id = ids.shift();
      if (!id) throw new Error("ledger test exhausted generated ids");
      return id;
    },
    now: () => TIMESTAMP,
  };
  return { collections, ledger: createSyncedTransactionLedger(dependencies) };
};

describe("PowerSync transaction ledger", () => {
  it("writes create, edit, and delete intents directly through the collection", async () => {
    const { collections, ledger } = await createHarness();
    const insert = jest.spyOn(collections.transactions, "insert");
    const update = jest.spyOn(collections.transactions, "update");
    const remove = jest.spyOn(collections.transactions, "delete");

    const id = await ledger.intents.create({
      type: "expense",
      amount: 1250,
      date: "2026-01-03",
      accountId: account.id,
      categoryId: category.id,
      description: "Lunch",
    });
    expect(id).toBe("transaction-new");
    expect(collections.transactions.get(id)).toMatchObject({
      amount_minor: 1250,
      currency: "USD",
      description: "Lunch",
    });
    expect(insert.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          envelope: expect.objectContaining({ kind: "transaction.create" }),
        }),
      }),
    );

    await ledger.intents.edit(id, { amount: 1400, description: "Lunch adjusted" });
    expect(collections.transactions.get(id)).toMatchObject({
      amount_minor: 1400,
      description: "Lunch adjusted",
      version: 1,
    });
    expect(update.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          envelope: expect.objectContaining({ kind: "transaction.edit" }),
        }),
      }),
    );

    await ledger.intents.remove(id);
    expect(collections.transactions.get(id)).toBeUndefined();
    expect(remove.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          envelope: expect.objectContaining({ kind: "transaction.remove" }),
        }),
      }),
    );
    ledger.dispose();
  });

  it("maps PowerSync rows into the existing ledger view contract", async () => {
    const { ledger } = await createHarness([transaction]);

    expect(ledger.rows()).toEqual([
      expect.objectContaining({
        id: transaction.id,
        amount: 500,
        account: expect.objectContaining({ id: account.id }),
        category: expect.objectContaining({ id: category.id }),
        version: 2,
        sync: { kind: "confirmed" },
      }),
    ]);
    expect(ledger.status()).toMatchObject({ phase: "ready", queuedCommands: 0 });
    ledger.dispose();
  });

  it("creates an optimistic refund row linked to the original category", async () => {
    const { collections, ledger } = await createHarness([transaction]);
    const insert = jest.spyOn(collections.transactions, "insert");

    const id = await ledger.intents.linkRefund({
      originalTransactionId: transaction.id,
      depositAccountId: account.id,
      currency: "USD",
      amount: 200,
      date: "2026-01-04",
    });

    expect(id).toBe("transaction-new");
    expect(collections.transactions.get(id)).toMatchObject({
      type: "income",
      amount_minor: 200,
      category_id: category.id,
      description: "Refund of transaction-existing",
    });
    expect(insert.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          envelope: expect.objectContaining({ kind: "refund.link" }),
        }),
      }),
    );
    ledger.dispose();
  });
});
