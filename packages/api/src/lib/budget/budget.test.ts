import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  rolloverSetting,
} from "@trove/db/schema/budget";
import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { category, ledgerAccount } from "@trove/db/schema/ledger";

import { listEnvelopes } from "./envelopes";
import {
  getCategoryMappingTimeline,
  getFundingMembershipTimeline,
  getRolloverSettingTimeline,
} from "./period-effective";
import { createTestDb } from "../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const VIEWER = "user-viewer";
const OUTSIDER = "user-outsider";
const HOUSEHOLD_ID = "household-1";

let db: TestDb;

beforeEach(async () => {
  db = await setupBudget();
});

async function setupBudget(): Promise<TestDb> {
  const database = await createTestDb();
  for (const [id, name] of [
    [OWNER, "Owner"],
    [VIEWER, "Viewer"],
    [OUTSIDER, "Outsider"],
  ] as const) {
    await database.insert(user).values({ id, name, email: `${id}@example.com` });
  }
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Test Household",
    createdByUserId: OWNER,
  });
  for (const [userId, role] of [
    [OWNER, "admin"],
    [VIEWER, "viewer"],
  ] as const) {
    await database.insert(membership).values({
      id: `membership-${userId}`,
      userId,
      householdId: HOUSEHOLD_ID,
      role,
    });
  }
  await database.insert(budgetWorkspace).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    currency: "USD",
    activationPeriod: "2026-01",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
  return database;
}

async function insertEnvelope(id: string, overrides: Partial<typeof envelope.$inferInsert> = {}) {
  await db.insert(envelope).values({
    id,
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    currency: "USD",
    name: `Envelope ${id}`,
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

async function insertAccount(
  id: string,
  overrides: Partial<typeof ledgerAccount.$inferInsert> = {},
) {
  await db.insert(ledgerAccount).values({
    id,
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    name: `Account ${id}`,
    type: "bank",
    currency: "USD",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
    ...overrides,
  });
}

async function insertCategory(id: string, overrides: Partial<typeof category.$inferInsert> = {}) {
  await db.insert(category).values({
    id,
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    name: `Category ${id}`,
    type: "expense",
    lifecycle: "active",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
    ...overrides,
  });
}

describe("budget schema — append-only enforcement", () => {
  /** Drizzle wraps driver errors; the trigger's RAISE text lives in `cause`. */
  async function expectAppendOnlyRejection(promise: Promise<unknown>): Promise<void> {
    await expect(promise).rejects.toSatisfy((err: unknown) => {
      const text = `${String((err as Error)?.message)} ${String((err as Error & { cause?: Error })?.cause)}`;
      return /append-only/i.test(text);
    });
  }

  it("rejects UPDATE and DELETE on category_mappings", async () => {
    await insertEnvelope("env-1");
    await insertCategory("cat-1");
    await db.insert(categoryMapping).values({
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      categoryId: "cat-1",
      envelopeId: "env-1",
      effectiveFromPeriod: "2026-01",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });

    await expectAppendOnlyRejection(
      db
        .update(categoryMapping)
        .set({ envelopeId: null })
        .where(eq(categoryMapping.categoryId, "cat-1")),
    );

    await expectAppendOnlyRejection(
      db.delete(categoryMapping).where(eq(categoryMapping.categoryId, "cat-1")),
    );
  });

  it("rejects UPDATE and DELETE on funding_memberships", async () => {
    await insertAccount("acc-1");
    await db.insert(fundingMembership).values({
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      accountId: "acc-1",
      currency: "USD",
      active: true,
      effectiveFromPeriod: "2026-01",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });

    await expectAppendOnlyRejection(
      db
        .update(fundingMembership)
        .set({ active: false })
        .where(eq(fundingMembership.accountId, "acc-1")),
    );

    await expectAppendOnlyRejection(
      db.delete(fundingMembership).where(eq(fundingMembership.accountId, "acc-1")),
    );
  });

  it("rejects UPDATE and DELETE on rollover_settings and assignments", async () => {
    await insertEnvelope("env-r");
    await db.insert(rolloverSetting).values({
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      envelopeId: "env-r",
      positiveRollover: true,
      effectiveFromPeriod: "2026-01",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    await expectAppendOnlyRejection(
      db
        .update(rolloverSetting)
        .set({ positiveRollover: false })
        .where(eq(rolloverSetting.envelopeId, "env-r")),
    );
    await expectAppendOnlyRejection(
      db.delete(rolloverSetting).where(eq(rolloverSetting.envelopeId, "env-r")),
    );

    await db.insert(assignment).values({
      id: "asg-1",
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      currency: "USD",
      budgetPeriod: "2026-01",
      destinationEnvelopeId: "env-r",
      amountMinor: 5000,
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });
    await expectAppendOnlyRejection(
      db.update(assignment).set({ amountMinor: 10 }).where(eq(assignment.id, "asg-1")),
    );
    await expectAppendOnlyRejection(db.delete(assignment).where(eq(assignment.id, "asg-1")));
  });

  it("rejects malformed Budget Periods at the schema level", async () => {
    await insertCategory("cat-bad");
    await expect(
      db.insert(categoryMapping).values({
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        categoryId: "cat-bad",
        envelopeId: null,
        effectiveFromPeriod: "2026-1",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      }),
    ).rejects.toSatisfy((err: unknown) =>
      /period_format|GLOB/i.test(
        `${String((err as Error)?.message)} ${String((err as Error & { cause?: Error })?.cause)}`,
      ),
    );
  });

  it("enforces assignment data integrity checks", async () => {
    const base = {
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      currency: "USD",
      budgetPeriod: "2026-01",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    };
    await expect(
      db.insert(assignment).values({ ...base, id: "a", amountMinor: 0 }),
    ).rejects.toThrow(); // amount must be positive
    await expect(
      db.insert(assignment).values({ ...base, id: "a", amountMinor: 100 }),
    ).rejects.toThrow(); // needs source or destination
    await insertEnvelope("env-x");
    await expect(
      db.insert(assignment).values({
        ...base,
        id: "a",
        amountMinor: 100,
        sourceEnvelopeId: "env-x",
        destinationEnvelopeId: "env-x",
      }),
    ).rejects.toThrow(); // distinct endpoints
  });
});

describe("period-effective timelines — derived effective_to_period", () => {
  it("derives category mapping spans via LEAD and treats NULL targets as unmapped tombstones", async () => {
    await insertEnvelope("env-a");
    await insertEnvelope("env-b");
    await insertCategory("cat-1");
    await insertCategory("cat-2");
    const rows = [
      { categoryId: "cat-1", envelopeId: "env-a", period: "2026-01" },
      // Remap…
      { categoryId: "cat-1", envelopeId: "env-b", period: "2026-03" },
      // …then a tombstone: unmapped from 2026-05 onward.
      { categoryId: "cat-1", envelopeId: null, period: "2026-05" },
      // A different category's timeline is independent.
      { categoryId: "cat-2", envelopeId: "env-a", period: "2026-02" },
    ];
    for (const r of rows) {
      await db.insert(categoryMapping).values({
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        categoryId: r.categoryId,
        envelopeId: r.envelopeId,
        effectiveFromPeriod: r.period,
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      });
    }

    const timeline = await getCategoryMappingTimeline(db, {
      userId: OWNER,
      ledgerId: HOUSEHOLD_ID,
    });

    const cat1 = timeline.filter((r) => r.categoryId === "cat-1");
    expect(cat1).toEqual([
      {
        categoryId: "cat-1",
        envelopeId: "env-a",
        effectiveFromPeriod: "2026-01",
        effectiveToPeriod: "2026-03",
      },
      {
        categoryId: "cat-1",
        envelopeId: "env-b",
        effectiveFromPeriod: "2026-03",
        effectiveToPeriod: "2026-05",
      },
      {
        categoryId: "cat-1",
        envelopeId: null,
        effectiveFromPeriod: "2026-05",
        effectiveToPeriod: null,
      },
    ]);

    const cat2 = timeline.filter((r) => r.categoryId === "cat-2");
    expect(cat2[0]).toMatchObject({ effectiveFromPeriod: "2026-02", effectiveToPeriod: null });
  });

  it("derives funding membership spans with exit tombstones", async () => {
    await insertAccount("acc-1");
    await insertAccount("acc-2");
    const rows = [
      { accountId: "acc-1", active: true, period: "2026-01" },
      { accountId: "acc-1", active: false, period: "2026-04" }, // leaves the pool
      { accountId: "acc-2", active: true, period: "2026-02" },
    ];
    for (const r of rows) {
      await db.insert(fundingMembership).values({
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        accountId: r.accountId,
        currency: "USD",
        active: r.active,
        effectiveFromPeriod: r.period,
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      });
    }

    const timeline = await getFundingMembershipTimeline(db, {
      userId: OWNER,
      ledgerId: HOUSEHOLD_ID,
    });

    const acc1 = timeline.filter((r) => r.accountId === "acc-1");
    expect(acc1).toHaveLength(2);
    expect(acc1[0]).toMatchObject({ active: true, effectiveToPeriod: "2026-04" });
    expect(acc1[1]).toMatchObject({ active: false, effectiveToPeriod: null });
  });

  it("derives rollover setting spans per envelope", async () => {
    await insertEnvelope("env-r");
    await db.insert(rolloverSetting).values([
      {
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        envelopeId: "env-r",
        positiveRollover: true,
        effectiveFromPeriod: "2026-01",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
      {
        ledgerId: HOUSEHOLD_ID,
        householdId: HOUSEHOLD_ID,
        envelopeId: "env-r",
        positiveRollover: false,
        effectiveFromPeriod: "2026-02",
        version: 0,
        createdBy: OWNER,
        updatedBy: OWNER,
      },
    ]);

    const timeline = await getRolloverSettingTimeline(db, {
      userId: OWNER,
      ledgerId: HOUSEHOLD_ID,
    });
    expect(timeline).toEqual([
      {
        envelopeId: "env-r",
        positiveRollover: true,
        effectiveFromPeriod: "2026-01",
        effectiveToPeriod: "2026-02",
      },
      {
        envelopeId: "env-r",
        positiveRollover: false,
        effectiveFromPeriod: "2026-02",
        effectiveToPeriod: null,
      },
    ]);
  });
});

describe("budget reads — authorization", () => {
  beforeEach(async () => {
    await insertEnvelope("env-1");
    await insertEnvelope("env-2", { sortOrder: 1 });
  });

  it("lets any member read, including the read-only viewer role", async () => {
    const ownerView = await listEnvelopes(db, { userId: OWNER, ledgerId: HOUSEHOLD_ID });
    const viewerView = await listEnvelopes(db, { userId: VIEWER, ledgerId: HOUSEHOLD_ID });
    expect(ownerView.map((e) => e.id)).toEqual(["env-1", "env-2"]);
    expect(viewerView.map((e) => e.id)).toEqual(ownerView.map((e) => e.id));
  });

  it("rejects a non-member before any read", async () => {
    await expect(listEnvelopes(db, { userId: OUTSIDER, ledgerId: HOUSEHOLD_ID })).rejects.toThrow(
      /not a member/,
    );
    await expect(
      getCategoryMappingTimeline(db, { userId: OUTSIDER, ledgerId: HOUSEHOLD_ID }),
    ).rejects.toThrow(/not a member/);
    await expect(
      getFundingMembershipTimeline(db, { userId: OUTSIDER, ledgerId: HOUSEHOLD_ID }),
    ).rejects.toThrow(/not a member/);
    await expect(
      getRolloverSettingTimeline(db, { userId: OUTSIDER, ledgerId: HOUSEHOLD_ID }),
    ).rejects.toThrow(/not a member/);
  });

  it("keeps households isolated — another household's envelopes are invisible", async () => {
    await db.insert(household).values({
      id: "household-2",
      name: "Other Household",
      createdByUserId: OUTSIDER,
    });
    // OWNER is not a member of household-2; even with an envelope there, reads fail.
    await db.insert(envelope).values({
      id: "secret-env",
      ledgerId: "household-2",
      householdId: "household-2",
      currency: "EUR",
      name: "Secret",
      icon: "🔒",
      color: "#000000",
      lifecycle: "active",
      sortOrder: 0,
      version: 0,
      createdBy: OUTSIDER,
      updatedBy: OUTSIDER,
    });
    await expect(listEnvelopes(db, { userId: OWNER, ledgerId: "household-2" })).rejects.toThrow(
      /not a member/,
    );
  });
});
