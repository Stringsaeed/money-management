import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount, transaction } from "@trove/db/schema/ledger";

import { createTestDb } from "../../test-support/db";
import { getTransaction, listAccounts, listTransactions } from "../../lib/ledger/read";

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
    name: "Shared Household",
    createdByUserId: OWNER,
  });
  await db.insert(membership).values([
    { id: "membership-owner", userId: OWNER, householdId: HOUSEHOLD_ID, role: "admin" },
    {
      id: "membership-member",
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      role: "member",
    },
  ]);
  await db.insert(ledgerAccount).values([
    {
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      id: "account-a",
      name: "Shared checking",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
      ownerUserId: OWNER,
    },
    {
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      id: "account-b",
      name: "Joint savings",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
      ownerUserId: OWNER,
    },
  ]);
  await db.insert(transaction).values([
    {
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      id: "transaction-a",
      type: "income",
      amountMinor: 1000,
      currency: "USD",
      date: "2026-02-01",
      accountId: "account-a",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    },
    {
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      id: "transaction-b",
      type: "income",
      amountMinor: 1000,
      currency: "USD",
      date: "2026-02-02",
      accountId: "account-b",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    },
  ]);
});

describe("ledger reads", () => {
  it("returns all household accounts and transactions to every member", async () => {
    await expect(
      listAccounts(db, { userId: OWNER, householdId: HOUSEHOLD_ID }),
    ).resolves.toHaveLength(2);
    await expect(
      listAccounts(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }),
    ).resolves.toHaveLength(2);

    await expect(
      listTransactions(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }, 10),
    ).resolves.toMatchObject({
      transactions: [{ id: "transaction-b" }, { id: "transaction-a" }],
    });
  });
});

describe("transaction detail", () => {
  it("allows any member to read transactions on shared accounts", async () => {
    await expect(
      getTransaction(db, { userId: MEMBER, householdId: HOUSEHOLD_ID }, "transaction-b"),
    ).resolves.toMatchObject({ id: "transaction-b" });
  });
});

describe("transaction pagination", () => {
  it("does not skip rows that share the cursor date", async () => {
    await db.insert(transaction).values([
      {
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        id: "transaction-same-c",
        type: "income",
        amountMinor: 100,
        currency: "USD",
        date: "2026-03-01",
        accountId: "account-a",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        id: "transaction-same-b",
        type: "income",
        amountMinor: 100,
        currency: "USD",
        date: "2026-03-01",
        accountId: "account-a",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        id: "transaction-same-a",
        type: "income",
        amountMinor: 100,
        currency: "USD",
        date: "2026-03-01",
        accountId: "account-a",
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
      "transaction-b",
    ]);
  });
});
