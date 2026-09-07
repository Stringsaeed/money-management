import type { CommandEnvelope } from "@trove/protocol";

import { createSyncedLedgerDataSource } from "./synced";
import type { SyncedAccount, SyncedCategory } from "./synced-mappers";
import type { SyncedTransactionSnapshot } from "./synced-transaction-snapshot";

const mockEnqueueCommand = jest.fn();
const mockListProjectableCommands = jest.fn();
const mockReadSnapshot = jest.fn();
const mockWriteSnapshot = jest.fn();
const mockApply = jest.fn();
const mockListServerAccounts = jest.fn();
const mockListServerCategories = jest.fn();
const mockListServerTransactions = jest.fn();

jest.mock("@/lib/sync/outbox", () => ({
  enqueueCommand: (...args: unknown[]) => mockEnqueueCommand(...args),
  listProjectableCommands: (...args: unknown[]) => mockListProjectableCommands(...args),
}));

jest.mock("./synced-transaction-snapshot", () => ({
  readSyncedTransactionSnapshot: (...args: unknown[]) => mockReadSnapshot(...args),
  writeSyncedTransactionSnapshot: (...args: unknown[]) => mockWriteSnapshot(...args),
}));

jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    ledger: {
      accounts: { list: (...args: unknown[]) => mockListServerAccounts(...args) },
      categories: { list: (...args: unknown[]) => mockListServerCategories(...args) },
      transactions: { list: (...args: unknown[]) => mockListServerTransactions(...args) },
    },
    commands: { apply: (...args: unknown[]) => mockApply(...args) },
    sync: { getDelta: jest.fn() },
  },
}));

jest.mock("@/utils/id", () => ({
  generateId: jest.fn(() => "generated-id"),
}));

const HOUSEHOLD_ID = "household-1";
const USER_ID = "user-1";
const timestamp = "2026-01-01T00:00:00.000Z";

const cashAccount: SyncedAccount = {
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
  version: 3,
  createdBy: USER_ID,
  updatedBy: USER_ID,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const groceriesCategory: SyncedCategory = {
  householdId: HOUSEHOLD_ID,
  id: "groceries",
  name: "Groceries",
  type: "expense",
  color: "#B48A7B",
  icon: "🛒",
  parentId: null,
  sortOrder: 0,
  lifecycle: "active",
  lifecycleChangedAt: null,
  version: 3,
  createdBy: USER_ID,
  updatedBy: USER_ID,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const snapshot: SyncedTransactionSnapshot = {
  householdId: HOUSEHOLD_ID,
  userId: USER_ID,
  accounts: [cashAccount],
  categories: [groceriesCategory],
  transactions: [],
};

const fakeDb = { __fakeDb: true } as never;

const createCommand = (overrides: Partial<CommandEnvelope> = {}): CommandEnvelope => ({
  commandId: "command-create",
  householdId: HOUSEHOLD_ID,
  kind: "account.create",
  payload: {
    id: "everyday",
    name: "Everyday",
    type: "bank",
    currency: "AED",
    color: "#4A90D9",
    icon: "🏦",
    initialBalanceMinor: 0,
    excludeFromTotal: false,
    sortOrder: 0,
  },
  issuedAt: "2026-01-06T00:00:00.000Z",
  ...overrides,
});

const newAccount = {
  name: "Everyday",
  type: "checking" as const,
  currency: "AED",
  color: "#4A90D9",
  icon: "🏦",
  initialBalance: 0,
  excludeFromTotal: false,
  sortOrder: 0,
};

describe("createSyncedLedgerDataSource accounts", () => {
  beforeEach(() => {
    mockEnqueueCommand.mockResolvedValue(undefined);
    mockListProjectableCommands.mockResolvedValue([]);
    mockReadSnapshot.mockResolvedValue(snapshot);
    mockWriteSnapshot.mockResolvedValue(undefined);
    mockListServerAccounts.mockResolvedValue(snapshot.accounts);
    mockListServerCategories.mockResolvedValue(snapshot.categories);
    mockListServerTransactions.mockResolvedValue({ transactions: [], hasMore: false });
  });

  it("enqueues Account create, update, archive, and visibility without applying", async () => {
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
    });

    const createdId = await source.accounts.create(newAccount);
    await source.accounts.update("cash", { name: "Daily", visibility: "private" });
    await source.accounts.archive("cash");

    expect(createdId).toBe("generated-id");
    expect(mockEnqueueCommand.mock.calls.map(([, command]) => command.kind)).toEqual([
      "account.create",
      "account.update",
      "account.archive",
    ]);
    expect(mockEnqueueCommand.mock.calls[1][1]).toMatchObject({
      payload: { accountId: "cash", name: "Daily", visibility: "private" },
      preconditions: [{ entityId: "cash", expectedVersion: 3 }],
    });
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("enqueues Category create, update, and archive without applying", async () => {
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
    });

    const createdId = await source.categories.create({
      name: "Food",
      type: "expense",
      color: "#000",
      icon: "🛒",
      parentId: null,
      sortOrder: 0,
    });
    await source.categories.update("groceries", { name: "Dining", sortOrder: 4 });
    await source.categories.archive("groceries");

    expect(createdId).toBe("generated-id");
    expect(mockEnqueueCommand.mock.calls.map(([, command]) => command.kind)).toEqual([
      "category.create",
      "category.update",
      "category.archive",
    ]);
    expect(mockEnqueueCommand.mock.calls[0][1]).toMatchObject({
      payload: {
        id: "generated-id",
        name: "Food",
        type: "expense",
        parentId: null,
        sortOrder: 0,
      },
    });
    expect(mockEnqueueCommand.mock.calls[1][1]).toMatchObject({
      payload: { categoryId: "groceries", name: "Dining", sortOrder: 4 },
      preconditions: [{ entityId: "groceries", expectedVersion: 3 }],
    });
    expect(mockEnqueueCommand.mock.calls[2][1]).toMatchObject({
      payload: { categoryId: "groceries" },
      preconditions: [{ entityId: "groceries", expectedVersion: 3 }],
    });
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("enqueues while offline_cached and never calls apply", async () => {
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
      offlineState: { kind: "offline_cached", reason: "network_unavailable" },
    });

    await source.accounts.create(newAccount);

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      fakeDb,
      expect.objectContaining({ kind: "account.create", userId: USER_ID }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockListServerAccounts).not.toHaveBeenCalled();
  });

  it("reads the cached snapshot online instead of listing the server", async () => {
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
    });

    await expect(source.accounts.list()).resolves.toEqual([
      expect.objectContaining({ id: "cash", name: "Cash" }),
    ]);
    expect(mockReadSnapshot).toHaveBeenCalled();
    expect(mockListServerAccounts).not.toHaveBeenCalled();
    expect(mockListServerTransactions).not.toHaveBeenCalled();
  });

  it("folds a queued create into list, get, and listWithBalances after a restart", async () => {
    mockListProjectableCommands.mockResolvedValue([{ ...createCommand(), status: "pending" }]);
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
      offlineState: { kind: "offline_cached", reason: "network_unavailable" },
    });

    const listed = await source.accounts.list();
    const found = await source.accounts.get("everyday");
    const balances = await source.accounts.listWithBalances(false);

    expect(listed.map((account) => account.id)).toEqual(["cash", "everyday"]);
    expect(found).toMatchObject({ id: "everyday", name: "Everyday", type: "checking" });
    expect(balances.find((account) => account.id === "everyday")).toMatchObject({
      name: "Everyday",
      balance: 0,
    });
    expect(mockListServerAccounts).not.toHaveBeenCalled();
  });

  it("drops a rejected create from the projected snapshot", async () => {
    mockListProjectableCommands.mockResolvedValue([]);
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
      offlineState: { kind: "offline_cached", reason: "network_unavailable" },
    });

    await expect(source.accounts.get("everyday")).resolves.toBeUndefined();
    await expect(source.accounts.list()).resolves.toEqual([
      expect.objectContaining({ id: "cash" }),
    ]);
  });

  it("no-ops archive when the cached Account is already archived", async () => {
    mockReadSnapshot.mockResolvedValue({
      ...snapshot,
      accounts: [{ ...cashAccount, lifecycle: "archived", lifecycleChangedAt: timestamp }],
    });
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
    });

    await source.accounts.archive("cash");

    expect(mockEnqueueCommand).not.toHaveBeenCalled();
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("refuses update when the authorized Account is missing", async () => {
    mockReadSnapshot.mockResolvedValue({ ...snapshot, accounts: [] });
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
    });

    await expect(source.accounts.update("cash", { name: "Daily" })).rejects.toThrow(
      "not in the authorized ledger snapshot",
    );
    expect(mockEnqueueCommand).not.toHaveBeenCalled();
  });
});

const createCategoryCommand = (overrides: Partial<CommandEnvelope> = {}): CommandEnvelope => ({
  commandId: "command-category-create",
  householdId: HOUSEHOLD_ID,
  kind: "category.create",
  payload: {
    id: "dining",
    name: "Dining",
    type: "expense",
    color: "#B48A7B",
    icon: "🍽️",
    parentId: null,
    sortOrder: 1,
  },
  issuedAt: "2026-01-06T00:00:00.000Z",
  ...overrides,
});

const newCategory = {
  name: "Dining",
  type: "expense" as const,
  color: "#B48A7B",
  icon: "🍽️",
  parentId: null,
  sortOrder: 1,
};

describe("createSyncedLedgerDataSource categories", () => {
  beforeEach(() => {
    mockEnqueueCommand.mockResolvedValue(undefined);
    mockListProjectableCommands.mockResolvedValue([]);
    mockReadSnapshot.mockResolvedValue(snapshot);
    mockWriteSnapshot.mockResolvedValue(undefined);
    mockListServerAccounts.mockResolvedValue(snapshot.accounts);
    mockListServerCategories.mockResolvedValue(snapshot.categories);
    mockListServerTransactions.mockResolvedValue({ transactions: [], hasMore: false });
  });

  it("enqueues while offline_cached and never calls apply", async () => {
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
      offlineState: { kind: "offline_cached", reason: "network_unavailable" },
    });

    await source.categories.create(newCategory);

    expect(mockEnqueueCommand).toHaveBeenCalledWith(
      fakeDb,
      expect.objectContaining({ kind: "category.create", userId: USER_ID }),
    );
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockListServerCategories).not.toHaveBeenCalled();
  });

  it("folds a queued create into list and get after a restart", async () => {
    mockListProjectableCommands.mockResolvedValue([
      { ...createCategoryCommand(), status: "pending" },
    ]);
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
      offlineState: { kind: "offline_cached", reason: "network_unavailable" },
    });

    const listed = await source.categories.list("expense");
    const found = await source.categories.get("dining");

    expect(listed.map((category) => category.id)).toEqual(["groceries", "dining"]);
    expect(found).toMatchObject({ id: "dining", name: "Dining", type: "expense" });
    expect(mockListServerCategories).not.toHaveBeenCalled();
  });

  it("drops a rejected create from the projected snapshot", async () => {
    mockListProjectableCommands.mockResolvedValue([]);
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
      offlineState: { kind: "offline_cached", reason: "network_unavailable" },
    });

    await expect(source.categories.get("dining")).resolves.toBeUndefined();
    await expect(source.categories.list()).resolves.toEqual([
      expect.objectContaining({ id: "groceries" }),
    ]);
  });

  it("no-ops archive when the cached Category is already archived", async () => {
    mockReadSnapshot.mockResolvedValue({
      ...snapshot,
      categories: [{ ...groceriesCategory, lifecycle: "archived", lifecycleChangedAt: timestamp }],
    });
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
    });

    await source.categories.archive("groceries");

    expect(mockEnqueueCommand).not.toHaveBeenCalled();
    expect(mockApply).not.toHaveBeenCalled();
  });

  it("refuses update when the authorized Category is missing", async () => {
    mockReadSnapshot.mockResolvedValue({ ...snapshot, categories: [] });
    const source = createSyncedLedgerDataSource({
      householdId: HOUSEHOLD_ID,
      userId: USER_ID,
      db: fakeDb,
    });

    await expect(source.categories.update("groceries", { name: "Dining" })).rejects.toThrow(
      "not in the authorized ledger snapshot",
    );
    expect(mockEnqueueCommand).not.toHaveBeenCalled();
  });
});
