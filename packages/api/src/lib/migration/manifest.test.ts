import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { assignment, budgetWorkspace, envelope } from "@trove/db/schema/budget";
import { ledgerAccount, category, transaction } from "@trove/db/schema/ledger";

import { createTestDb } from "../commands/test-db";
import { computeImportManifest } from "./manifest";

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
  it("counts rows and sums amounts by account/currency, scoped to the household", async () => {
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
    await db.insert(budgetWorkspace).values({
      householdId: HOUSEHOLD_ID,
      currency: "USD",
      activationPeriod: "2026-01",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    await db.insert(envelope).values({
      householdId: HOUSEHOLD_ID,
      id: "envelope-1",
      currency: "USD",
      name: "Groceries",
      icon: "🛒",
      color: "#8B9D83",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    await db.insert(assignment).values([
      {
        householdId: HOUSEHOLD_ID,
        id: "assignment-1",
        currency: "USD",
        budgetPeriod: "2026-01",
        destinationEnvelopeId: "envelope-1",
        amountMinor: 4_000,
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        householdId: HOUSEHOLD_ID,
        id: "assignment-2",
        currency: "USD",
        budgetPeriod: "2026-01",
        destinationEnvelopeId: "envelope-1",
        amountMinor: 1_000,
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
    ]);

    // A different household's rows must never leak into this manifest.
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
      recurringRule: 0,
      recurringOccurrence: 0,
      transaction: 4,
      budgetWorkspace: 1,
      envelope: 1,
      categoryMapping: 0,
      fundingMembership: 0,
      rolloverSetting: 0,
      assignment: 2,
    });
    expect(manifest.transactionAmountMinorByAccount).toEqual({
      "account-1": 1_500,
      "account-2": 2_000,
      "account-3": 300,
    });
    expect(manifest.assignmentAmountMinorByCurrency).toEqual({ USD: 5_000 });
  });

  it("returns zeroed counts and empty sums for a household with no imported rows", async () => {
    const manifest = await computeImportManifest(db, HOUSEHOLD_ID);
    expect(Object.values(manifest.rowCounts).every((count) => count === 0)).toBe(true);
    expect(manifest.transactionAmountMinorByAccount).toEqual({});
    expect(manifest.assignmentAmountMinorByCurrency).toEqual({});
  });
});
