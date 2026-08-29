import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

import { createTestDb } from "../lib/commands/test-db";
import { applyCommand } from "../lib/commands/pipeline";
import { getDelta } from "../lib/sync/delta";
import { getTransaction, listAccounts, listTransactions } from "../lib/ledger/read";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const HOUSEHOLD_ID = "household-1";
const OWNER = "user-owner";
const MEMBER = "user-member";

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: OWNER, name: "Owner", email: "owner@example.com" },
    { id: MEMBER, name: "Member", email: "member@example.com" },
  ]);
  await db.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Privacy Household",
    createdByUserId: OWNER,
  });
  await db.insert(membership).values([
    { id: "membership-owner", userId: OWNER, householdId: HOUSEHOLD_ID, role: "owner", version: 0 },
    {
      id: "membership-member",
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      role: "member",
      version: 0,
    },
  ]);
  await db.insert(ledgerAccount).values([
    {
      householdId: HOUSEHOLD_ID,
      id: "account-public",
      name: "Shared checking",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
      ownerUserId: OWNER,
      visibility: "public",
    },
    {
      householdId: HOUSEHOLD_ID,
      id: "account-private",
      name: "Personal checking",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
      ownerUserId: OWNER,
      visibility: "private",
    },
  ]);
  await db.insert(transaction).values([
    {
      householdId: HOUSEHOLD_ID,
      id: "transaction-public",
      type: "income",
      amountMinor: 1000,
      currency: "USD",
      date: "2026-02-01",
      accountId: "account-public",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    },
    {
      householdId: HOUSEHOLD_ID,
      id: "transaction-private",
      type: "income",
      amountMinor: 1000,
      currency: "USD",
      date: "2026-02-02",
      accountId: "account-private",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    },
  ]);
});

describe("ledger privacy reads", () => {
  it("returns private accounts and transactions only to their owner", async () => {
    await expect(
      listAccounts(db, { userId: OWNER, householdId: HOUSEHOLD_ID }),
    ).resolves.toHaveLength(2);
    await expect(
      listTransactions(db, { userId: OWNER, householdId: HOUSEHOLD_ID }, 10),
    ).resolves.toMatchObject({
      transactions: [{ id: "transaction-private" }, { id: "transaction-public" }],
    });

    await expect(
      listAccounts(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }),
    ).resolves.toMatchObject([{ id: "account-public" }]);
    await expect(
      listTransactions(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }, 10),
    ).resolves.toMatchObject({
      transactions: [{ id: "transaction-public" }],
    });
  });
});

describe("transaction detail", () => {
  it("applies the same private visibility predicate to detail reads", async () => {
    await expect(
      getTransaction(db, { userId: OWNER, householdId: HOUSEHOLD_ID }, "transaction-private"),
    ).resolves.toMatchObject({ id: "transaction-private" });
    await expect(
      getTransaction(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }, "transaction-private"),
    ).resolves.toBeNull();
  });
});

describe("transaction pagination", () => {
  it("does not skip rows that share the cursor date", async () => {
    await db.insert(transaction).values([
      {
        householdId: HOUSEHOLD_ID,
        id: "transaction-same-c",
        type: "income",
        amountMinor: 100,
        currency: "USD",
        date: "2026-03-01",
        accountId: "account-public",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "transaction-same-b",
        type: "income",
        amountMinor: 100,
        currency: "USD",
        date: "2026-03-01",
        accountId: "account-public",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "transaction-same-a",
        type: "income",
        amountMinor: 100,
        currency: "USD",
        date: "2026-03-01",
        accountId: "account-public",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
    ]);

    const first = await listTransactions(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }, 2);
    const second = await listTransactions(
      db,
      { userId: MEMBER, householdId: HOUSEHOLD_ID },
      2,
      first.nextCursor!,
    );

    expect([...first.transactions, ...second.transactions].map((row) => row.id)).toEqual([
      "transaction-same-c",
      "transaction-same-b",
      "transaction-same-a",
      "transaction-public",
    ]);
  });
});

describe("poll-only convergence", () => {
  it("exposes a server-created Transaction after a delta pull without push", async () => {
    await db.insert(category).values({
      householdId: HOUSEHOLD_ID,
      id: "category-income",
      name: "Income",
      type: "income",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });

    const result = await applyCommand({
      db,
      userId: MEMBER,
      envelope: {
        commandId: "poll-created-transaction",
        householdId: HOUSEHOLD_ID,
        kind: "transaction.create",
        payload: {
          id: "transaction-polled",
          type: "income",
          amountMinor: 2500,
          date: "2026-03-02",
          accountId: "account-public",
          categoryId: "category-income",
        },
      },
    });
    expect(result.kind).toBe("applied");

    const delta = await getDelta({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      since: 0,
    });
    expect(delta.changes.some(({ effects }) => effects.includes("ledger"))).toBe(true);
    const page = await listTransactions(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }, 10);
    expect(page.transactions).toContainEqual(expect.objectContaining({ id: "transaction-polled" }));
  });
});
