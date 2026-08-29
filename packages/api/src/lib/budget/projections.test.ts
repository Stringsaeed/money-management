import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  periodProjectionCache,
  rolloverSetting,
} from "@trove/db/schema/budget";
import { user } from "@trove/db/schema/auth";
import { householdChange, commandResult } from "@trove/db/schema/commands";
import { household, membership } from "@trove/db/schema/household";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

import { createTestDb } from "../commands/test-db";
import { applyCommand } from "../commands/pipeline";
import { enumeratePeriods, getProjections } from "./projections";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const OUTSIDER = "user-outsider";
const HOUSEHOLD_ID = "household-1";

let db: TestDb;
let seqCounter = 0;

beforeEach(async () => {
  db = await setupBudget();
});

async function setupBudget(): Promise<TestDb> {
  const database = await createTestDb();
  for (const id of [OWNER, OUTSIDER]) {
    await database.insert(user).values({ id, name: id, email: `${id}@example.com` });
  }
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Projection Household",
    createdByUserId: OWNER,
  });
  await database.insert(membership).values({
    id: `membership-${OWNER}`,
    userId: OWNER,
    householdId: HOUSEHOLD_ID,
    role: "owner",
    version: 0,
  });
  await database.insert(budgetWorkspace).values({
    householdId: HOUSEHOLD_ID,
    currency: "USD",
    activationPeriod: "2026-01",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
  return database;
}

/** Simulates a committed command: advances the sync seq the cache stamps with. */
async function appendChange(effects: string[] = ["ledger"]): Promise<void> {
  seqCounter += 1;
  const commandId = `cmd-${seqCounter}`;
  await db.insert(householdChange).values({
    id: `change-${seqCounter}`,
    householdId: HOUSEHOLD_ID,
    seq: seqCounter,
    userId: OWNER,
    commandId,
    effects: effects as never,
  });
  await db.insert(commandResult).values({
    householdId: HOUSEHOLD_ID,
    commandId,
    result: { ok: true },
  });
}

async function seedAccount(id: string, initialBalanceMinor = 0, type = "bank", poolMember = true) {
  await db.insert(ledgerAccount).values({
    householdId: HOUSEHOLD_ID,
    id,
    name: `Account ${id}`,
    type: type as "bank",
    currency: "USD",
    initialBalanceMinor,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
  if (poolMember) {
    await db.insert(fundingMembership).values({
      householdId: HOUSEHOLD_ID,
      accountId: id,
      currency: "USD",
      active: true,
      effectiveFromPeriod: "2026-01",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
  }
}

const seedFundingAccount = (id: string, initialBalanceMinor = 0, type = "bank") =>
  seedAccount(id, initialBalanceMinor, type, true);
const seedCardAccount = (id: string) => seedAccount(id, 0, "card", false);

async function seedEnvelope(id: string, overrides: Partial<typeof envelope.$inferInsert> = {}) {
  await db.insert(envelope).values({
    householdId: HOUSEHOLD_ID,
    id,
    name: `Envelope ${id}`,
    currency: "USD",
    icon: "🎯",
    color: "#8B9D83",
    lifecycle: "active",
    sortOrder: 0,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
    ...overrides,
  });
}

async function seedCategory(id: string) {
  await db.insert(category).values({
    householdId: HOUSEHOLD_ID,
    id,
    name: `Category ${id}`,
    type: "expense",
    lifecycle: "active",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function mapCategory(
  categoryId: string,
  envelopeId: string,
  effectiveFromPeriod = "2026-01",
) {
  await db.insert(categoryMapping).values({
    householdId: HOUSEHOLD_ID,
    categoryId,
    envelopeId,
    effectiveFromPeriod,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function assign(
  budgetPeriod: string,
  destinationEnvelopeId: string | null,
  amountMinor: number,
) {
  await db.insert(assignment).values({
    id: crypto.randomUUID(),
    householdId: HOUSEHOLD_ID,
    currency: "USD",
    budgetPeriod,
    destinationEnvelopeId,
    sourceEnvelopeId: null,
    amountMinor,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function spendExpense(
  date: string,
  amountMinor: number,
  accountId = "acc-cash",
  categoryId?: string,
) {
  await db.insert(transaction).values({
    householdId: HOUSEHOLD_ID,
    id: crypto.randomUUID(),
    type: "expense",
    amountMinor,
    currency: "USD",
    date,
    accountId,
    categoryId: categoryId ?? null,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

function read() {
  return getProjections(
    db,
    { userId: OWNER, householdId: HOUSEHOLD_ID },
    {
      currency: "USD",
      startPeriod: "2026-01",
      endPeriod: "2026-03",
    },
  );
}

describe("period projections", () => {
  it("computes Available Money, Envelope Health, and Rollover accurately", async () => {
    // Funding Pool = 100_000. Groceries assigned 30k in Jan and Feb; a
    // further 20k cash spend lands in February mid-test.
    await seedFundingAccount("acc-cash", 100000);
    await seedCardAccount("acc-card");
    await seedEnvelope("env-groceries");
    await seedCategory("cat-groceries");
    await mapCategory("cat-groceries", "env-groceries");
    await assign("2026-01", "env-groceries", 30000);
    await assign("2026-02", "env-groceries", 30000);
    await appendChange();

    const first = await read();
    expect(first.projections.map((p) => p.budgetPeriod)).toEqual(["2026-01", "2026-02", "2026-03"]);

    const january = first.projections[0];
    expect(january.fundingPoolMinor).toBe(100000);
    expect(january.assignedMinor).toBe(30000);
    expect(january.unassignedMinor).toBe(70000);
    const janEnv = january.envelopes.find((e) => e.envelopeId === "env-groceries");
    expect(janEnv?.availableMinor).toBe(30000);
    expect(janEnv?.assignedMinor).toBe(30000);
    expect(janEnv?.health.status).toBe("ready");

    // March mirrors the not-yet-posted state via Rollover carry (30k + 30k).
    const marchBefore = first.projections[2];
    expect(
      marchBefore.envelopes.find((e) => e.envelopeId === "env-groceries")?.availableMinor,
    ).toBe(60000);

    // Now post February spending; projections must reflect it after rebuild.
    await spendExpense("2026-02-10", 20000, "acc-cash", "cat-groceries");
    await appendChange();
    const second = await read();
    const feb = second.projections[1];
    const febEnv = feb.envelopes.find((e) => e.envelopeId === "env-groceries");
    expect(febEnv?.availableMinor).toBe(40000); // 30k Jan carry + 30k − 20k
    const marchAfter = second.projections[2];
    expect(marchAfter.envelopes.find((e) => e.envelopeId === "env-groceries")?.availableMinor).toBe(
      40000,
    );
  });

  it("replays a historical server correction through every later projection", async () => {
    await seedFundingAccount("acc-cash", 100000);
    await seedEnvelope("env-groceries");
    await seedCategory("cat-groceries");
    await mapCategory("cat-groceries", "env-groceries");
    await assign("2026-01", "env-groceries", 30000);
    await db.insert(transaction).values({
      householdId: HOUSEHOLD_ID,
      id: "expense-correction",
      type: "expense",
      amountMinor: 10000,
      currency: "USD",
      date: "2026-01-15",
      accountId: "acc-cash",
      categoryId: "cat-groceries",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });

    const before = await read();
    expect(
      before.projections.map(
        (projection) =>
          projection.envelopes.find(({ envelopeId }) => envelopeId === "env-groceries")
            ?.availableMinor,
      ),
    ).toEqual([20000, 20000, 20000]);

    const correction = await applyCommand({
      db,
      userId: OWNER,
      envelope: {
        commandId: "correct-historical-expense",
        householdId: HOUSEHOLD_ID,
        kind: "transaction.edit",
        payload: { transactionId: "expense-correction", amountMinor: 20000 },
        preconditions: [{ entityId: "expense-correction", expectedVersion: 0 }],
      },
    });
    expect(correction.kind).toBe("applied");

    const after = await read();
    expect(
      after.projections.map(
        (projection) =>
          projection.envelopes.find(({ envelopeId }) => envelopeId === "env-groceries")
            ?.availableMinor,
      ),
    ).toEqual([10000, 10000, 10000]);
  });

  it("excludes private accounts and their spending from shared projections", async () => {
    await seedFundingAccount("acc-shared", 10000);
    await seedFundingAccount("acc-private", 50000);
    await db
      .update(ledgerAccount)
      .set({ ownerUserId: OWNER, visibility: "private" })
      .where(eq(ledgerAccount.id, "acc-private"));
    await seedEnvelope("env-groceries");
    await seedCategory("cat-groceries");
    await mapCategory("cat-groceries", "env-groceries");
    await assign("2026-01", "env-groceries", 2000);
    await spendExpense("2026-01-15", 500, "acc-private", "cat-groceries");
    await db.insert(transaction).values({
      householdId: HOUSEHOLD_ID,
      id: "private-transfer",
      type: "transfer",
      amountMinor: 2000,
      currency: "USD",
      date: "2026-01-16",
      accountId: "acc-private",
      toAccountId: "acc-shared",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    await appendChange();

    const { projections } = await read();
    const january = projections[0];
    expect(january.fundingPoolMinor).toBe(10000);
    expect(
      january.envelopes.find((item) => item.envelopeId === "env-groceries")?.availableMinor,
    ).toBe(2000);
  });

  it("routes card spending through availability without going negative, reporting Unfunded Card Spending", async () => {
    await seedFundingAccount("acc-cash", 50000);
    await seedCardAccount("acc-card");
    await seedEnvelope("env-travel");
    await seedCategory("cat-travel");
    await mapCategory("cat-travel", "env-travel");
    await assign("2026-01", "env-travel", 10000);
    await appendChange();
    // 25k on the card against only 10k available → clamps at zero, 15k unfunded.
    await spendExpense("2026-01-15", 25000, "acc-card", "cat-travel");
    await appendChange();

    const { projections } = await read();
    const january = projections[0];
    const env = january.envelopes.find((e) => e.envelopeId === "env-travel");
    expect(env?.availableMinor).toBe(0);
    expect(env?.unfundedCardSpendingMinor).toBe(15000);
    expect(env?.health).toEqual({
      status: "needs_attention",
      reasons: [{ kind: "unfunded-card-spending" }],
    });
  });

  it("flags cash Envelope Overspending negatively and carries it forward", async () => {
    await seedFundingAccount("acc-cash", 10000);
    await seedEnvelope("env-fun");
    await seedCategory("cat-fun");
    await mapCategory("cat-fun", "env-fun");
    await assign("2026-01", "env-fun", 5000);
    await appendChange();
    await spendExpense("2026-01-20", 8000, "acc-cash", "cat-fun");
    await appendChange();

    const { projections } = await read();
    const env = projections[0].envelopes.find((e) => e.envelopeId === "env-fun");
    expect(env?.availableMinor).toBe(-3000);
    expect(env?.health.reasons).toEqual([{ kind: "envelope-overspending" }]);
    // Negative carry lands in February untouched.
    const feb = projections[1].envelopes.find((e) => e.envelopeId === "env-fun");
    expect(feb?.availableMinor).toBe(-3000);
  });

  it("truncates positive carry for envelopes configured to start fresh", async () => {
    await seedFundingAccount("acc-cash", 20000);
    await seedEnvelope("env-fresh");
    await seedCategory("cat-fresh");
    await mapCategory("cat-fresh", "env-fresh");
    await db.insert(rolloverSetting).values({
      householdId: HOUSEHOLD_ID,
      envelopeId: "env-fresh",
      positiveRollover: false,
      effectiveFromPeriod: "2026-02",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    await assign("2026-01", "env-fresh", 10000);
    await appendChange();

    const { projections } = await read();
    // January keeps its full availability…
    expect(projections[0].envelopes.find((e) => e.envelopeId === "env-fresh")?.availableMinor).toBe(
      10000,
    );
    // …but February starts fresh at zero (positive part returned to Unassigned).
    expect(projections[1].envelopes.find((e) => e.envelopeId === "env-fresh")?.availableMinor).toBe(
      0,
    );
  });

  it("reconciles Assigned + Unassigned to the Funding Pool with reserves carved from assigned", async () => {
    await seedFundingAccount("acc-cash", 80000);
    await seedCardAccount("acc-card");
    await seedEnvelope("env-a");
    await seedEnvelope("env-b");
    await seedCategory("cat-a");
    await mapCategory("cat-a", "env-a");
    await assign("2026-01", "env-a", 12000);
    await assign("2026-01", "env-b", 3000);
    await assign("2026-02", "env-a", 7000);
    await spendExpense("2026-01-05", 4000, "acc-card", "cat-a");
    await appendChange();

    const { projections } = await read();
    for (const period of projections) {
      // The documented reconciliation invariant (reserves ⊆ assigned).
      expect(period.fundingPoolMinor).toBe(period.assignedMinor + period.unassignedMinor);
      expect(period.reservesMinor).toBeLessThanOrEqual(period.assignedMinor);
      const envelopeSum = period.envelopes.reduce((t, e) => t + e.availableMinor, 0);
      // Per-envelope availability reconciles to workspace-level facts.
      expect(period.assignedMinor - envelopeSum).toBeGreaterThanOrEqual(0);
    }
    expect(projections[0].fundingPoolMinor).toBe(80000);
    expect(projections[1].assignedMinor).toBe(22000);
  });

  it("stamps the cache with the household's current seq", async () => {
    await seedFundingAccount("acc-cash", 5000);
    await seedEnvelope("env-x");
    await seedCategory("cat-x");
    await mapCategory("cat-x", "env-x");
    await appendChange();

    const first = await read();
    expect(first.seqStamped).toBe(seqCounter);

    await appendChange(); // any committed write advances the stamp
    const second = await read();
    expect(second.seqStamped).toBe(seqCounter);
    expect(second.seqStamped).toBeGreaterThan(first.seqStamped);
  });

  it("invalidates stale cache rows when the seq advances and rebuilds on the next read", async () => {
    await seedFundingAccount("acc-cash", 50000);
    await seedEnvelope("env-y");
    await seedCategory("cat-y");
    await mapCategory("cat-y", "env-y");
    await assign("2026-01", "env-y", 20000);
    await appendChange();

    const initial = await read();
    expect(initial.projections[0].envelopes[0].availableMinor).toBe(20000);

    // New spending WITHOUT touching the projection code path directly.
    await spendExpense("2026-01-10", 6000, "acc-cash", "cat-y");
    await appendChange();

    const rebuilt = await read();
    expect(rebuilt.projections[0].envelopes[0].availableMinor).toBe(14000);

    // And the rebuilt rows are stamped with the new seq.
    const cached = await db.select().from(periodProjectionCache);
    for (const row of cached) {
      expect(row.seqStamped).toBe(seqCounter);
    }
  });

  it("serves repeat reads from the cache without rebuilding", async () => {
    await seedFundingAccount("acc-cash", 1000);
    await seedEnvelope("env-z");
    await seedCategory("cat-z");
    await mapCategory("cat-z", "env-z");
    await appendChange();

    const first = await read();
    const rowsBefore = await db.select().from(periodProjectionCache);
    const computedAtBefore = rowsBefore.map((r) => r.computedAt.getTime());

    const second = await read();
    const rowsAfter = await db.select().from(periodProjectionCache);
    const computedAtAfter = rowsAfter.map((r) => r.computedAt.getTime());

    expect(second).toEqual(first);
    expect(computedAtAfter).toEqual(computedAtBefore);
    expect(rowsAfter).toHaveLength(rowsBefore.length);
  });

  it("scopes projections by household membership", async () => {
    await seedFundingAccount("acc-cash", 1000);
    await seedEnvelope("env-s");
    await appendChange();

    await db
      .insert(user)
      .values({ id: "x", name: "x", email: "x@example.com" })
      .onConflictDoNothing();
    await expect(
      getProjections(
        db,
        { userId: OUTSIDER, householdId: HOUSEHOLD_ID },
        {
          currency: "USD",
          startPeriod: "2026-01",
          endPeriod: "2026-01",
        },
      ),
    ).rejects.toThrow(/not a member/i);
  });

  it("throws a helpful error when the workspace is not activated", async () => {
    await db.delete(budgetWorkspace);
    await expect(read()).rejects.toThrow(/No Budget Workspace exists/i);
  });

  it("enumerates periods inclusively across year boundaries", () => {
    expect(enumeratePeriods("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
    expect(enumeratePeriods("2026-03", "2026-03")).toEqual(["2026-03"]);
  });
});
