import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount, category, transaction } from "@trove/db/schema/ledger";

import { createTestDb } from "../../test-support/db";
import { computeImportManifest, parseImportAggregate } from "./manifest";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const HOUSEHOLD_ID = "household-1";
const OTHER_HOUSEHOLD_ID = "household-2";

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values({ id: OWNER, name: "Owner", email: `${OWNER}@example.com` });
  await db.insert(household).values([
    { id: HOUSEHOLD_ID, name: "Manifest Household", createdByUserId: OWNER },
    { id: OTHER_HOUSEHOLD_ID, name: "Other Household", createdByUserId: OWNER },
  ]);
  await db.insert(membership).values({
    id: "membership-owner",
    userId: OWNER,
    householdId: HOUSEHOLD_ID,
    role: "owner",
    version: 0,
  });
});

describe("computeImportManifest", () => {
  it("normalizes PostgreSQL bigint aggregates at the database boundary", () => {
    expect(parseImportAggregate("101", "transaction count")).toBe(101);
    expect(parseImportAggregate("10100", "transaction amount sum")).toBe(10_100);
  });

  it("counts ledger facts and sums transactions by account, scoped to the household", async () => {
    await db.insert(ledgerAccount).values([
      {
        householdId: HOUSEHOLD_ID,
        id: "account-1",
        name: "Checking",
        type: "bank",
        currency: "USD",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "account-2",
        name: "Euro account",
        type: "bank",
        currency: "EUR",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "account-3",
        name: "Savings",
        type: "bank",
        currency: "USD",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
    ]);
    await db.insert(category).values({
      householdId: HOUSEHOLD_ID,
      id: "category-1",
      name: "Groceries",
      type: "expense",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    await db.insert(transaction).values([
      {
        householdId: HOUSEHOLD_ID,
        id: "txn-1",
        type: "expense",
        amountMinor: 1_000,
        currency: "USD",
        date: "2026-01-05",
        accountId: "account-1",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "txn-2",
        type: "expense",
        amountMinor: 500,
        currency: "USD",
        date: "2026-01-06",
        accountId: "account-1",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "txn-3",
        type: "expense",
        amountMinor: 2_000,
        currency: "EUR",
        date: "2026-01-07",
        accountId: "account-2",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "txn-4",
        type: "expense",
        amountMinor: 300,
        currency: "USD",
        date: "2026-01-08",
        accountId: "account-3",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
    ]);
    await db.insert(ledgerAccount).values({
      householdId: OTHER_HOUSEHOLD_ID,
      id: "account-other",
      name: "Not this household",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });

    const manifest = await computeImportManifest(db, HOUSEHOLD_ID);

    expect(manifest.rowCounts).toEqual({
      account: 3,
      category: 1,
      transaction: 4,
    });
    expect(manifest.transactionAmountMinorByAccount).toEqual({
      "account-1": 1_500,
      "account-2": 2_000,
      "account-3": 300,
    });
  });

  it("returns zeroed counts and empty sums for a household with no imported rows", async () => {
    const manifest = await computeImportManifest(db, HOUSEHOLD_ID);
    expect(Object.values(manifest.rowCounts).every((count) => count === 0)).toBe(true);
    expect(manifest.transactionAmountMinorByAccount).toEqual({});
  });
});
