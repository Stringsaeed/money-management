import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { localDateInTimeZone } from "@trove/domain/clock";
import type { SettlementIdentity } from "@trove/domain/settlement";
import { personalLedgerId } from "@trove/protocol";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { ledger } from "@trove/db/schema/ledger-scope";
import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";
import { ledgerAccount } from "@trove/db/schema/ledger";

import { createTestDb } from "../../test-support/db";
import { createSettlementIdentity, settleDueRules } from "./scheduler";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

let db: TestDb;
let seq = 0;

beforeEach(async () => {
  seq = 0;
  db = await createTestDb();
});

async function seedHousehold(id: string) {
  const owner = `user-owner-${id}`;
  await db.insert(user).values({ id: owner, name: "Owner", email: `${owner}@example.com` });
  await db.insert(household).values({ id, name: `Household ${id}`, createdByUserId: owner });
  await db.insert(membership).values({
    id: `membership-${id}`,
    userId: owner,
    householdId: id,
    role: "admin",
  });
  return owner;
}

async function seedAccount(householdId: string, id: string, currency = "USD") {
  await db.insert(ledgerAccount).values({
    ledgerId: householdId,
    householdId,
    id,
    name: `Account ${id}`,
    type: "bank",
    currency,
    initialBalanceMinor: 0,
    version: 0,
    createdBy: `user-owner-${householdId}`,
    updatedBy: `user-owner-${householdId}`,
  });
}

interface RuleOverrides {
  readonly id?: string;
  readonly frequency?: "day" | "week" | "month" | "year";
  readonly startDate?: string;
  readonly timeZone?: string;
  readonly lifecycle?: "active" | "paused" | "archived";
  readonly eligibilityFloor?: string;
  readonly householdId?: string;
}

async function insertRule(overrides: RuleOverrides = {}) {
  const householdId = overrides.householdId ?? "household-1";
  seq += 1;
  const row: typeof recurringRule.$inferInsert = {
    type: "expense",
    ledgerId: householdId,
    householdId,
    id: overrides.id ?? `rule-${seq}`,
    name: `Rule ${String(seq).padStart(2, "0")}`,
    amountMinor: 10000,
    currency: "USD",
    accountId: `account-${householdId}`,
    description: `Rule ${String(seq).padStart(2, "0")}`,
    frequency: overrides.frequency ?? ("day" as const),
    intervalCount: 1,
    startDate: overrides.startDate ?? "2026-04-10",
    endDate: null,
    endCount: null,
    timeZone: overrides.timeZone ?? "UTC",
    lifecycle: overrides.lifecycle ?? ("active" as const),
    health: "ready",
    eligibilityFloor: overrides.eligibilityFloor ?? overrides.startDate ?? "2026-04-10",
    revision: 1,
    createdBy: `user-owner-${householdId}`,
    updatedBy: `user-owner-${householdId}`,
  };
  await db.insert(recurringRule).values(row);
  return row.id;
}

// 2026-04-15T12:00:00Z — already the 16th east of the date line, still the
// 15th in UTC, and only just past midnight of the 15th west of it.
const NOW = new Date("2026-04-15T12:00:00.000Z");

function identity(): SettlementIdentity {
  let n = 0;
  return { next: () => `sched-tx-${++n}` };
}

async function occurrenceDates(ruleId: string): Promise<string[]> {
  return (
    await db.select().from(recurringOccurrence).where(eq(recurringOccurrence.ruleId, ruleId))
  ).map((o) => o.scheduledDate);
}

describe("scheduled settlement sweep", () => {
  it("evaluates each rule on its own time zone's local date", async () => {
    await seedHousehold("household-1");
    await seedAccount("household-1", "account-household-1");
    // Daily rules; Kiritimati (UTC+14) is already on the 16th at NOW while
    // Pago Pago (UTC−11) is still on the 15th.
    const ahead = await insertRule({
      id: "rule-ahead",
      timeZone: "Pacific/Kiritimati",
      startDate: "2026-04-10",
      eligibilityFloor: "2026-04-10",
    });
    const behind = await insertRule({
      id: "rule-behind",
      timeZone: "Pacific/Pago_Pago",
      startDate: "2026-04-10",
      eligibilityFloor: "2026-04-10",
    });

    expect(localDateInTimeZone(NOW, "Pacific/Kiritimati")).toBe("2026-04-16");
    expect(localDateInTimeZone(NOW, "Pacific/Pago_Pago")).toBe("2026-04-15");

    const summary = await settleDueRules(db, identity(), NOW);

    // The ahead-of-UTC rule settles through ITS local today (10th–16th = 7);
    // the behind one is never pulled forward (10th–15th = 6).
    expect((await occurrenceDates(ahead)).sort()).toEqual([
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
      "2026-04-13",
      "2026-04-14",
      "2026-04-15",
      "2026-04-16",
    ]);
    expect((await occurrenceDates(behind)).sort()).toEqual([
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
      "2026-04-13",
      "2026-04-14",
      "2026-04-15",
    ]);
    expect(summary.generatedCount).toBe(13);
  });

  it("is idempotent under Cron Trigger retries", async () => {
    await seedHousehold("household-1");
    await seedAccount("household-1", "account-household-1");
    await insertRule({});

    const first = await settleDueRules(db, identity(), NOW);
    expect(first.generatedCount).toBe(6);

    const retry = await settleDueRules(db, identity(), NOW);
    expect(retry.generatedCount).toBe(0);
    expect(await occurrenceDates("rule-1")).toHaveLength(6);
  });

  it("isolates households — a paused household's rules never settle", async () => {
    await seedHousehold("household-1");
    await seedHousehold("household-2");
    await seedAccount("household-1", "account-household-1");
    await seedAccount("household-2", "account-household-2");
    await insertRule({ id: "rule-active", householdId: "household-1" });
    await insertRule({
      id: "rule-paused",
      householdId: "household-2",
      lifecycle: "paused",
    });

    const summary = await settleDueRules(db, identity(), NOW);

    expect(summary.households).toBe(1);
    expect(summary.generatedCount).toBe(6);
    expect(
      await db
        .select()
        .from(recurringOccurrence)
        .where(eq(recurringOccurrence.ruleId, "rule-paused")),
    ).toHaveLength(0);
  });

  it("skips archived rules entirely", async () => {
    await seedHousehold("household-1");
    await seedAccount("household-1", "account-household-1");
    await insertRule({ id: "rule-gone", lifecycle: "archived" });

    const summary = await settleDueRules(db, identity(), NOW);
    expect(summary.households).toBe(0);
    expect(summary.generatedCount).toBe(0);
  });

  it("includes personal ledgers in the hourly fan-out", async () => {
    const owner = "user-personal-sweep";
    const ledgerId = personalLedgerId(owner);
    await db.insert(user).values({ id: owner, name: "Solo", email: `${owner}@example.com` });
    await db.insert(ledger).values({
      id: ledgerId,
      kind: "personal",
      personalUserId: owner,
      organizationId: null,
    });
    await db.insert(ledgerAccount).values({
      ledgerId,
      householdId: null,
      id: "account-personal",
      name: "Wallet",
      type: "cash",
      currency: "USD",
      initialBalanceMinor: 0,
      version: 0,
      createdBy: owner,
      updatedBy: owner,
    });
    await db.insert(recurringRule).values({
      ledgerId,
      householdId: null,
      id: "rule-personal",
      name: "Personal coffee",
      type: "expense",
      amountMinor: 400,
      currency: "USD",
      accountId: "account-personal",
      description: "Daily",
      frequency: "day",
      intervalCount: 1,
      startDate: "2026-04-15",
      endDate: null,
      endCount: null,
      timeZone: "UTC",
      lifecycle: "active",
      health: "ready",
      eligibilityFloor: "2026-04-15",
      revision: 1,
      createdBy: owner,
      updatedBy: owner,
    });

    const summary = await settleDueRules(db, identity(), NOW);
    expect(summary.households).toBe(1);
    expect(summary.generatedCount).toBe(1);
    expect(await occurrenceDates("rule-personal")).toEqual(["2026-04-15"]);
  });

  it("uses production-shaped identities without colliding across sweeps", async () => {
    await seedHousehold("household-1");
    await seedAccount("household-1", "account-household-1");
    await insertRule({ id: "rule-prod", startDate: "2026-04-15", eligibilityFloor: "2026-04-15" });

    const first = await settleDueRules(db, createSettlementIdentity(), NOW);
    const second = await settleDueRules(db, createSettlementIdentity(), NOW);

    expect(first.generatedCount).toBe(1);
    // A retried sweep reuses no transaction ids — but generates nothing new.
    expect(second.generatedCount).toBe(0);
  });
});
