import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount, category, transaction } from "@trove/db/schema/ledger";
import { canonicalizeImportContent } from "@trove/protocol";

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
  it("reads every aggregate and content row from one repeatable snapshot", async () => {
    const transactionSpy = vi.spyOn(db, "transaction");

    await computeImportManifest(db, HOUSEHOLD_ID);

    expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    });
  });

  it("canonicalizes key order and equivalent timestamp offsets", () => {
    const first = canonicalizeImportContent([
      {
        entityType: "account",
        row: { id: "account-1", createdAt: "2026-01-01T04:00:00+04:00", name: "Checking" },
      },
    ]);
    const second = canonicalizeImportContent([
      {
        entityType: "account",
        row: { name: "Checking", createdAt: "2026-01-01T00:00:00.000Z", id: "account-1" },
      },
    ]);

    expect(first).toBe(second);
  });

  it("normalizes PostgreSQL bigint aggregates at the database boundary", () => {
    expect(parseImportAggregate("101", "transaction count")).toBe(101);
    expect(parseImportAggregate("10100", "transaction amount sum")).toBe(10_100);
    expect(parseImportAggregate(101, "transaction count")).toBe(101);
    expect(parseImportAggregate(10_100n, "transaction amount sum")).toBe(10_100);
  });

  it.each(["", "10.5", "invalid", "-1", 10.5, -1, 9_007_199_254_740_992n])(
    "rejects an unsafe aggregate value: %s",
    (value) => {
      expect(() => parseImportAggregate(value, "transaction count")).toThrow(
        "Invalid transaction count returned by the database.",
      );
    },
  );

  it("rejects an unsafe numeric aggregate string", () => {
    expect(() => parseImportAggregate("9007199254740992", "transaction count")).toThrow(
      "Invalid transaction count returned by the database.",
    );
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
      assignment: 0,
      budget_workspace: 0,
      category: 1,
      category_mapping: 0,
      envelope: 0,
      funding_membership: 0,
      recurring_occurrence: 0,
      recurring_rule: 0,
      rollover_setting: 0,
      transaction: 4,
    });
    expect(manifest.transactionAmountMinorByAccount).toEqual({
      "account-1": 1_500,
      "account-2": 2_000,
      "account-3": 300,
    });
    expect(manifest.contentDigest).toMatch(/^[a-f0-9]{64}$/);

    const beforeContentEdit = manifest.contentDigest;
    await db.update(transaction).set({ description: "Changed" }).where(eq(transaction.id, "txn-1"));
    const afterContentEdit = await computeImportManifest(db, HOUSEHOLD_ID);
    expect(afterContentEdit.rowCounts).toEqual(manifest.rowCounts);
    expect(afterContentEdit.transactionAmountMinorByAccount).toEqual(
      manifest.transactionAmountMinorByAccount,
    );
    expect(afterContentEdit.contentDigest).not.toBe(beforeContentEdit);
  });

  it("returns zeroed counts and empty sums for a household with no imported rows", async () => {
    const manifest = await computeImportManifest(db, HOUSEHOLD_ID);
    expect(Object.values(manifest.rowCounts).every((count) => count === 0)).toBe(true);
    expect(manifest.transactionAmountMinorByAccount).toEqual({});
    expect(manifest.contentDigest).toMatch(/^[a-f0-9]{64}$/);
  });
});
