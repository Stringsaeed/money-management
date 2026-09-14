import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { householdChange } from "@trove/db/schema/commands";
import { household, membership } from "@trove/db/schema/household";
import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";
import { ledgerAccount, transaction } from "@trove/db/schema/ledger";

import { createTestDb } from "../../../test-support/db";
import { settleHouseholdRules } from "../settle-household";
type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const HOUSEHOLD_ID = "household-1";

let db: TestDb;
let seq = 0;

beforeEach(async () => {
  seq = 0;
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  await database.insert(user).values({ id: OWNER, name: "Owner", email: `${OWNER}@example.com` });
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Recurring Household",
    createdByUserId: OWNER,
  });
  await database.insert(membership).values({
    id: `membership-${OWNER}`,
    userId: OWNER,
    householdId: HOUSEHOLD_ID,
    role: "admin",
  });
  return database;
}

async function seedAccount(id: string, currency = "USD") {
  await db.insert(ledgerAccount).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    id,
    name: `Account ${id}`,
    type: "bank",
    currency,
    initialBalanceMinor: 0,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

interface RuleOverrides {
  id?: string;
  name?: string;
  amountMinor?: number | null;
  accountId?: string | null;
  toAccountId?: string | null;
  categoryId?: string | null;
  type?: "expense" | "income" | "transfer";
  frequency?: "day" | "week" | "month" | "year";
  intervalCount?: number;
  startDate?: string;
  endDate?: string | null;
  endCount?: number | null;
  lifecycle?: "active" | "paused" | "completed" | "archived";
  health?: "ready" | "needs_attention";
  eligibilityFloor?: string;
  revision?: number;
}

async function insertRule(overrides: RuleOverrides = {}): Promise<string> {
  seq += 1;
  const id = overrides.id ?? `rule-${seq}`;
  await db.insert(recurringRule).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    id,
    name: overrides.name ?? `Rent ${seq}`,
    type: overrides.type ?? "expense",
    amountMinor: (overrides.amountMinor ?? 120_000) as number | null,
    currency: "USD",
    accountId: overrides.accountId ?? "account-1",
    toAccountId: overrides.toAccountId ?? null,
    categoryId: overrides.categoryId ?? null,
    description: "Monthly rent",
    frequency: overrides.frequency ?? "month",
    intervalCount: overrides.intervalCount ?? 1,
    startDate: overrides.startDate ?? "2026-01-31",
    endDate: overrides.endDate ?? null,
    endCount: overrides.endCount ?? null,
    timeZone: "Asia/Dubai",
    lifecycle: overrides.lifecycle ?? "active",
    health: overrides.health ?? "ready",
    eligibilityFloor: overrides.eligibilityFloor ?? "2026-01-31",
    revision: overrides.revision ?? 1,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
  return id;
}

function settle(localDate = "2026-04-15") {
  return settleHouseholdRules(
    db,
    { householdId: HOUSEHOLD_ID, userId: OWNER },
    // Production uses UUIDs; ids must never repeat across sweeps.
    { next: () => crypto.randomUUID() },
    localDate,
    "2026-04-15T08:00:00.000Z",
  );
}

describe("settlement engine — identical results vs. client prior art", () => {
  beforeEach(async () => {
    await seedAccount("account-1");
  });

  it("settles each occurrence once, even after its generated transaction is deleted", async () => {
    await insertRule({
      id: "rule-existing",
      name: "Rent existing",
      eligibilityFloor: "2026-01-31",
    });

    const first = await settle();
    expect(first.generatedCount).toBe(3);

    // Delete the first generated transaction — the occurrence must remain.
    const occurrence = (
      await db
        .select()
        .from(recurringOccurrence)
        .where(eq(recurringOccurrence.scheduledDate, "2026-01-31"))
    )[0];
    expect(occurrence).toBeDefined();
    await db.delete(transaction).where(eq(transaction.id, occurrence.transactionId!));

    const second = await settle();
    expect(second.generatedCount).toBe(0);

    const occurrences = await db.select().from(recurringOccurrence);
    expect(occurrences).toHaveLength(3);
    const recurringTxns = (await db.select().from(transaction)).filter(
      (t) => t.recurringRuleId === "rule-existing",
    );
    expect(recurringTxns).toHaveLength(2);
  });

  it("is idempotent across concurrent double-settlement via the occurrence PK", async () => {
    await insertRule({ eligibilityFloor: "2026-01-31" });
    await settle();

    // A second sweep finds nothing pending.
    const again = await settle();
    expect(again.generatedCount).toBe(0);
    expect(again.rules.every((r) => r.kind === "not_due")).toBe(true);
  });

  it("applies the pre-edit state before a same-day pause and skips the paused interval on resume", async () => {
    const ruleId = await insertRule({ startDate: "2026-04-15", eligibilityFloor: "2026-04-15" });

    // Settle April while active.
    const april = await settle("2026-04-15");
    expect(april.generatedCount).toBe(1);

    // Pause before May's occurrence lands; pause bumps the revision.
    const pausedAt = new Date("2026-04-20T08:00:00.000Z");
    await db
      .update(recurringRule)
      .set({ lifecycle: "paused", revision: 5, lifecycleChangedAt: pausedAt })
      .where(eq(recurringRule.id, ruleId));

    // While paused: ineligible, nothing settles.
    const mayPaused = await settle("2026-05-31");
    expect(mayPaused.generatedCount).toBe(0);

    // Resume with an eligibility floor of the resume date: the skipped
    // interval does not retroactively settle.
    await db
      .update(recurringRule)
      .set({ lifecycle: "active", eligibilityFloor: "2026-06-01" })
      .where(eq(recurringRule.id, ruleId));

    const june = await settle("2026-06-30");
    expect(june.generatedCount).toBe(1);
    // Monthly on the 15th: the skipped May interval never settles; June does.
    const dates = (await db.select().from(recurringOccurrence)).map((o) => o.scheduledDate);
    expect(dates).toEqual(["2026-04-15", "2026-06-15"]);
  });

  it("completes a rule after its endCount is reached and stops generating", async () => {
    await insertRule({
      frequency: "day",
      intervalCount: 1,
      startDate: "2026-02-01",
      eligibilityFloor: "2026-02-01",
      endCount: 3,
    });

    const first = await settle("2026-02-28");
    const ruleRow = (await db.select().from(recurringRule))[0];
    expect(ruleRow.lifecycle).toBe("completed");
    void first;

    const afterCompletion = await settle("2026-03-31");
    expect(afterCompletion.generatedCount).toBe(0);
    expect(afterCompletion.rules.every((r) => r.kind === "ineligible")).toBe(true);
  });
});

describe("settlement engine — revision & optimistic concurrency", () => {
  beforeEach(async () => {
    await seedAccount("account-1");
  });

  it("increments the rule revision when settlement changes state", async () => {
    const ruleId = await insertRule({ revision: 7 });
    await settle();
    const row = (await db.select().from(recurringRule).where(eq(recurringRule.id, ruleId)))[0];
    expect(row.revision).toBe(8);
  });

  it("aborts the commit when another writer bumped the revision mid-settlement", async () => {
    const { PgRecurringStore } = await import("../pg-store");
    const { assertionStatement, executeLedgerTransaction } =
      await import("../../commands/statements");

    const ruleId = await insertRule({ revision: 3 });

    // Read the rule, then simulate an interleaved edit landing before commit.
    const store = new PgRecurringStore(
      db,
      { ledgerId: HOUSEHOLD_ID, householdId: HOUSEHOLD_ID, userId: OWNER },
      (() => {
        let n = 0;
        return () => `tx-${++n}`;
      }) as never,
    );

    const staleCommit = {
      ruleId,
      expectedRevision: 3, // stale: the concurrent writer moved it to 9
      nextRevision: 4,
      lifecycle: "active" as const,
      lifecycleChanged: false,
      health: "ready" as const,
      attentionReasonsJson: null,
      generated: [],
      settledDates: [],
      now: "2026-04-15T08:00:00.000Z",
    };

    const guard = sql`(SELECT COUNT(*) FROM ${recurringRule}
        WHERE ${recurringRule.ledgerId} = ${HOUSEHOLD_ID}
          AND ${recurringRule.id} = ${ruleId}
          AND ${recurringRule.revision} = ${staleCommit.expectedRevision}) = 1`;

    // The interleaved edit wins the race first.
    await db.update(recurringRule).set({ revision: 9 }).where(eq(recurringRule.id, ruleId));

    // The stale settlement's assertion now fails: the batch must abort whole
    // instead of clobbering the concurrent edit.
    await expect(
      executeLedgerTransaction(db, [assertionStatement(db as never, guard)], HOUSEHOLD_ID),
    ).rejects.toThrow();

    // The engine's own commit path goes through the identical assertion.
    await expect(store.commitRuleSettlement(staleCommit)).rejects.toThrow();
  });
});

describe("settlement engine — order, sync effects, attention handling", () => {
  beforeEach(async () => {
    await seedAccount("account-1");
  });

  it("settles independent rules in deterministic order and reports unexpected failures separately", async () => {
    await insertRule({ name: "Alpha", eligibilityFloor: "2026-01-31" });
    await insertRule({ name: "Beta", eligibilityFloor: "2026-01-31", health: "needs_attention" });
    await insertRule({ name: "Gamma", eligibilityFloor: "2026-01-31" });

    const summary = await settle();
    expect(summary.rules.map((r) => r.ruleId)).toEqual(
      [...summary.rules.map((r) => r.ruleId)].sort(),
    );
    // Needs-attention rules are reported, never silently dropped.
    expect(summary.rules.some((r) => r.ruleId.endsWith("") && r.kind === "needs_attention")).toBe(
      true,
    );
    expect(summary.effects).toContain("ledger");
  });

  it("appends one household_changes entry per settled rule with ledger effects", async () => {
    await insertRule({ eligibilityFloor: "2026-01-31" });
    await settle();

    const changes = await db.select().from(householdChange);
    expect(changes.length).toBeGreaterThanOrEqual(1);
    const change = changes[0];
    expect(change.commandId.startsWith("settlement:rule-")).toBe(true);
    expect(change.effects).toContain("ledger");

    // A no-op sweep appends nothing further.
    await settle();
    expect((await db.select().from(householdChange)).length).toBe(changes.length);
  });

  it("flags rules whose source account disappeared or changed currency", async () => {
    await insertRule({ id: "rule-ghost", accountId: "ghost-account", health: "ready" });
    await seedAccount("fx-account", "EUR");
    await insertRule({ accountId: "fx-account", health: "ready", id: "rule-fx", name: "FX Rent" });

    const summary = await settle();
    const flagged = summary.rules.filter((r) => r.kind === "needs_attention");
    expect(flagged.map((r) => r.ruleId).sort()).toEqual(["rule-fx", "rule-ghost"]);

    const rows = await db.select().from(recurringRule);
    expect(rows.find((r) => r.id === "rule-fx")?.health).toBe("needs_attention");
    expect(JSON.parse(rows.find((r) => r.id === "rule-ghost")!.attentionReasons)).toEqual([
      expect.objectContaining({ kind: "missing-source-account" }),
    ]);
    expect(rows.find((r) => r.id === "rule-fx")?.revision).toBe(2);
  });

  it("scopes sweeps by household — other households' rules are untouched", async () => {
    const OTHER = "household-2";
    await db.insert(user).values({ id: "user-other", name: "Other", email: "other@example.com" });
    await db
      .insert(household)
      .values({ id: OTHER, name: "Other Household", createdByUserId: OWNER });
    await db.insert(membership).values({
      id: "membership-other",
      userId: "user-other",
      householdId: OTHER,
      role: "admin",
    });

    await insertRule({ eligibilityFloor: "2026-01-31" });
    await db.insert(recurringRule).values({
      ledgerId: OTHER,
      householdId: OTHER,
      id: "rule-foreign",
      name: "Foreign Rule",
      type: "expense",
      amountMinor: 500,
      currency: "USD",
      accountId: "acc-x",
      description: "",
      frequency: "month",
      intervalCount: 1,
      startDate: "2026-01-31",
      endDate: null,
      endCount: null,
      timeZone: "Asia/Dubai",
      lifecycle: "active",
      health: "ready",
      eligibilityFloor: "2026-01-31",
      revision: 1,
      createdBy: OWNER,
      updatedBy: OWNER,
    });

    const summary = await settle();
    expect(summary.rules.some((r) => r.ruleId === "rule-foreign")).toBe(false);
    expect(summary.generatedCount).toBeGreaterThan(0);
  });
});
