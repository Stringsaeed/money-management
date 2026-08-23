import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { migrateAccountLifecycle } from "@/db/account-lifecycle-migration";
import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { archiveCategory } from "@/modules/categories/category-lifecycle";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { createRecurringRules, RecurringSettlementError, type RecurringRuleDraft } from ".";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

const draft: RecurringRuleDraft = {
  name: "Rent",
  type: "expense",
  amountMinor: 120_000,
  currency: "USD",
  accountId: "account-1",
  toAccountId: null,
  categoryId: null,
  description: "Monthly rent",
  frequency: "month",
  intervalCount: 1,
  startDate: "2026-01-31",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
};

async function setup() {
  let currentLocalDate = "2026-04-15";
  let currentNow = new Date("2026-04-15T08:00:00.000Z");
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  await applyLegacyMigrations(testDatabase.database);
  await migrateRecurringRules(testDatabase.database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-04-15",
    now: "2026-04-15T08:00:00.000Z",
  });
  await migrateBudgeting(testDatabase.database);
  await migrateCategoryLifecycle(testDatabase.database);
  await migrateAccountLifecycle(testDatabase.database);
  await testDatabase.database.runAsync(
    `INSERT INTO accounts (
      id, name, type, currency, color, icon, initial_balance,
      exclude_from_total, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "account-1",
    "Main",
    "checking",
    "USD",
    "#8B9D83",
    "🏦",
    0,
    0,
    0,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );

  const counters = new Map<string, number>();
  const recurringRules = createRecurringRules({
    database: testDatabase.database,
    clock: {
      now: () => currentNow,
      localDate: () => currentLocalDate,
    },
    identity: {
      next: (kind) => {
        const next = (counters.get(kind) ?? 0) + 1;
        counters.set(kind, next);
        return `${kind}-${next}`;
      },
    },
  });

  return {
    database: testDatabase.database,
    recurringRules,
    moveClock: (localDate: string, now = `${localDate}T08:00:00.000Z`) => {
      currentLocalDate = localDate;
      currentNow = new Date(now);
    },
  };
}

async function insertRule(
  database: SQLiteDatabase,
  values: Omit<Partial<RecurringRuleDraft>, "amountMinor" | "accountId"> & {
    id?: string;
    lifecycle?: "active" | "paused" | "archived" | "completed";
    health?: "ready" | "needs_attention";
    eligibilityFloor?: string;
    revision?: number;
    amountMinor?: number | null;
    accountId?: string | null;
  } = {},
) {
  const rule = { ...draft, ...values };
  await database.runAsync(
    `INSERT INTO recurring_rules (
      id, name, type, amount_minor, currency, account_id, to_account_id,
      category_id, description, frequency, interval_count, start_date,
      end_date, end_count, time_zone, lifecycle, health, attention_reasons,
      eligibility_floor, revision, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values.id ?? "rule-existing",
    rule.name,
    rule.type,
    rule.amountMinor,
    rule.currency,
    rule.accountId,
    rule.toAccountId,
    rule.categoryId,
    rule.description,
    rule.frequency,
    rule.intervalCount,
    rule.startDate,
    rule.endDate,
    rule.endCount,
    rule.timeZone,
    values.lifecycle ?? "active",
    values.health ?? "ready",
    values.health === "needs_attention"
      ? JSON.stringify([{ kind: "invalid-legacy-amount" }])
      : "[]",
    values.eligibilityFloor ?? rule.startDate,
    values.revision ?? 1,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("Recurring Rules", () => {
  it("blocks an existing active Rule honestly after its Category is archived", async () => {
    const { database, recurringRules } = await setup();
    await insertCategory(database, "category-archived");
    await insertRule(database, { categoryId: "category-archived" });
    await archiveCategory(database, {
      categoryId: "category-archived",
      localDate: "2026-04-15",
      now: "2026-04-15T08:00:00.000Z",
    });

    await expect(recurringRules.settle()).resolves.toMatchObject({
      generatedCount: 0,
      rules: [{ ruleId: "rule-existing", kind: "needs_attention", generatedCount: 0 }],
    });
    await expect(
      database.getFirstAsync(
        `SELECT health, attention_reasons AS attentionReasons
         FROM recurring_rules WHERE id = ?`,
        "rule-existing",
      ),
    ).resolves.toEqual({
      health: "needs_attention",
      attentionReasons: JSON.stringify([
        { kind: "archived-category", categoryId: "category-archived" },
      ]),
    });
  });

  it("keeps a paused Rule blocked if it resumes after its Category is archived", async () => {
    const { database, recurringRules } = await setup();
    await insertCategory(database, "category-archived");
    await insertRule(database, { categoryId: "category-archived", lifecycle: "paused" });
    await archiveCategory(database, {
      categoryId: "category-archived",
      localDate: "2026-04-15",
      now: "2026-04-15T08:00:00.000Z",
    });

    await expect(
      recurringRules.change({ kind: "resume", ruleId: "rule-existing", expectedRevision: 2 }),
    ).resolves.toMatchObject({ kind: "applied", revision: 3 });
    await expect(recurringRules.settle()).resolves.toMatchObject({
      generatedCount: 0,
      rules: [{ ruleId: "rule-existing", kind: "needs_attention", generatedCount: 0 }],
    });
  });

  it("rejects an archived Category for a new Rule", async () => {
    const { database, recurringRules } = await setup();
    await insertCategory(database, "category-archived");
    await database.runAsync(
      "UPDATE categories SET lifecycle = 'archived' WHERE id = ?",
      "category-archived",
    );

    await expect(
      recurringRules.change({
        kind: "create",
        rule: { ...draft, categoryId: "category-archived" },
      }),
    ).resolves.toEqual({
      kind: "invalid_intent",
      issues: [{ field: "categoryId", message: "Choose an available Category." }],
    });
  });

  it("previews and atomically confirms a past-dated Rule", async () => {
    const { database, recurringRules } = await setup();
    const intent = { kind: "create", rule: draft } as const;

    const preview = await recurringRules.change(intent);

    expect(preview).toEqual({
      kind: "preview_required",
      confirmationToken: "confirmation-1",
      preview: {
        count: 3,
        totalMinor: 360_000,
        currency: "USD",
        firstDate: "2026-01-31",
        lastDate: "2026-03-31",
      },
    });
    if (preview.kind !== "preview_required") throw new Error("Expected creation preview.");
    const confirmationToken = preview.confirmationToken;

    const result = await recurringRules.change({
      ...intent,
      confirmationToken,
    });

    expect(result).toEqual({
      kind: "applied",
      ruleId: "rule-1",
      revision: 1,
      settlement: { generatedCount: 3, totalMinor: 360_000 },
      effects: ["rules", "upcoming", "ledger", "balances", "summaries"],
    });
    await expect(
      database.getAllAsync(
        `SELECT scheduled_date AS scheduledDate
         FROM recurring_occurrences ORDER BY scheduled_date`,
      ),
    ).resolves.toEqual([
      { scheduledDate: "2026-01-31" },
      { scheduledDate: "2026-02-28" },
      { scheduledDate: "2026-03-31" },
    ]);
    await expect(
      database.getAllAsync(
        `SELECT id, recurring_rule_id AS recurringRuleId, date
         FROM transactions ORDER BY date`,
      ),
    ).resolves.toEqual([
      { id: "transaction-1", recurringRuleId: "rule-1", date: "2026-01-31" },
      { id: "transaction-2", recurringRuleId: "rule-1", date: "2026-02-28" },
      { id: "transaction-3", recurringRuleId: "rule-1", date: "2026-03-31" },
    ]);

    await expect(recurringRules.change({ ...intent, confirmationToken })).resolves.toMatchObject({
      kind: "preview_required",
      confirmationToken: "confirmation-2",
    });
    await expect(
      database.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM recurring_rules"),
    ).resolves.toEqual({ count: 1 });
  });

  it("settles each Occurrence once even after its Generated Transaction is deleted", async () => {
    const { database, recurringRules } = await setup();
    await insertRule(database);

    const firstRequest = recurringRules.settle();
    const coalescedRequest = recurringRules.settle();
    expect(coalescedRequest).toBe(firstRequest);
    const first = await firstRequest;
    expect(first.generatedCount).toBe(3);

    const occurrence = await database.getFirstAsync<{ transactionId: string }>(
      `SELECT transaction_id AS transactionId
       FROM recurring_occurrences
       WHERE rule_id = ? AND scheduled_date = ?`,
      "rule-existing",
      "2026-01-31",
    );
    if (!occurrence) throw new Error("Expected the first settled Occurrence.");
    await database.runAsync("DELETE FROM transactions WHERE id = ?", occurrence.transactionId);

    const second = await recurringRules.settle();

    expect(second.generatedCount).toBe(0);
    await expect(
      database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM recurring_occurrences WHERE rule_id = ?",
        "rule-existing",
      ),
    ).resolves.toEqual({ count: 3 });
    await expect(
      database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM transactions WHERE recurring_rule_id = ?",
        "rule-existing",
      ),
    ).resolves.toEqual({ count: 2 });
  });

  it("settles today's old state before pause and skips the paused interval on resume", async () => {
    const { database, recurringRules, moveClock } = await setup();
    await insertRule(database, {
      startDate: "2026-04-15",
      eligibilityFloor: "2026-04-15",
      endCount: 2,
    });

    const preview = await recurringRules.change({
      kind: "pause",
      ruleId: "rule-existing",
      expectedRevision: 1,
    });
    expect(preview).toMatchObject({
      kind: "preview_required",
      preview: { count: 1, firstDate: "2026-04-15", lastDate: "2026-04-15" },
    });
    if (preview.kind !== "preview_required") throw new Error("Expected pause preview.");

    const paused = await recurringRules.change({
      kind: "pause",
      ruleId: "rule-existing",
      expectedRevision: 1,
      confirmationToken: preview.confirmationToken,
    });
    expect(paused).toMatchObject({ kind: "applied", revision: 2 });

    moveClock("2026-05-31");
    const resumed = await recurringRules.change({
      kind: "resume",
      ruleId: "rule-existing",
      expectedRevision: 2,
    });
    expect(resumed).toMatchObject({
      kind: "applied",
      revision: 3,
      settlement: { generatedCount: 0 },
    });

    moveClock("2026-06-30");
    await expect(recurringRules.settle()).resolves.toMatchObject({ generatedCount: 1 });
    await expect(
      database.getAllAsync(
        `SELECT scheduled_date AS scheduledDate
         FROM recurring_occurrences WHERE rule_id = ? ORDER BY scheduled_date`,
        "rule-existing",
      ),
    ).resolves.toEqual([{ scheduledDate: "2026-04-15" }, { scheduledDate: "2026-06-15" }]);
    await expect(
      database.getFirstAsync("SELECT lifecycle FROM recurring_rules WHERE id = ?", "rule-existing"),
    ).resolves.toEqual({ lifecycle: "completed" });
  });

  it("rejects a stale edit without changing the Rule", async () => {
    const { database, recurringRules } = await setup();
    await insertRule(database, { revision: 2, startDate: "2026-05-01" });

    await expect(
      recurringRules.change({
        kind: "edit",
        ruleId: "rule-existing",
        expectedRevision: 1,
        rule: { ...draft, name: "Changed", startDate: "2026-05-01" },
      }),
    ).resolves.toEqual({
      kind: "stale_revision",
      ruleId: "rule-existing",
      expectedRevision: 1,
      actualRevision: 2,
    });
    await expect(
      database.getFirstAsync(
        "SELECT name, revision FROM recurring_rules WHERE id = ?",
        "rule-existing",
      ),
    ).resolves.toEqual({ name: "Rent", revision: 2 });
  });

  it("rolls back old-state Settlement when the prospective edit fails", async () => {
    const { database, recurringRules } = await setup();
    await insertRule(database, { startDate: "2026-04-15", eligibilityFloor: "2026-04-15" });
    const intent = {
      kind: "edit",
      ruleId: "rule-existing",
      expectedRevision: 1,
      rule: {
        ...draft,
        name: "Changed",
        amountMinor: 130_000,
        startDate: "2026-04-15",
      },
    } as const;
    const preview = await recurringRules.change(intent);
    if (preview.kind !== "preview_required") throw new Error("Expected edit preview.");
    await database.execAsync(`
      CREATE TRIGGER fail_changed_rule
      BEFORE UPDATE ON recurring_rules
      WHEN NEW.name = 'Changed'
      BEGIN
        SELECT RAISE(ABORT, 'forced edit failure');
      END;
    `);

    await expect(
      recurringRules.change({ ...intent, confirmationToken: preview.confirmationToken }),
    ).rejects.toThrow();
    await expect(
      database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM recurring_occurrences WHERE rule_id = ?",
        "rule-existing",
      ),
    ).resolves.toEqual({ count: 0 });
    await expect(
      database.getFirstAsync(
        "SELECT name, amount_minor AS amountMinor, revision FROM recurring_rules WHERE id = ?",
        "rule-existing",
      ),
    ).resolves.toEqual({ name: "Rent", amountMinor: 120_000, revision: 1 });
  });

  it("repairs and catches up a Needs-Attention backlog with the proposed values", async () => {
    const { database, recurringRules } = await setup();
    await insertRule(database, {
      health: "needs_attention",
      amountMinor: null,
      accountId: null,
    });
    const repairedDraft = { ...draft, amountMinor: 125_000 };

    const preview = await recurringRules.change({
      kind: "repair",
      ruleId: "rule-existing",
      expectedRevision: 1,
      rule: repairedDraft,
    });
    expect(preview).toMatchObject({
      kind: "preview_required",
      preview: { count: 3, totalMinor: 375_000 },
    });
    if (preview.kind !== "preview_required") throw new Error("Expected repair preview.");

    const repaired = await recurringRules.change({
      kind: "repair",
      ruleId: "rule-existing",
      expectedRevision: 1,
      rule: repairedDraft,
      confirmationToken: preview.confirmationToken,
    });

    expect(repaired).toMatchObject({
      kind: "applied",
      revision: 2,
      settlement: { generatedCount: 3, totalMinor: 375_000 },
    });
    await expect(
      database.getFirstAsync(
        `SELECT amount_minor AS amountMinor, account_id AS accountId, health, revision
         FROM recurring_rules WHERE id = ?`,
        "rule-existing",
      ),
    ).resolves.toEqual({
      amountMinor: 125_000,
      accountId: "account-1",
      health: "ready",
      revision: 2,
    });
  });

  it("keeps archived Rules out of the default list and restores them prospectively", async () => {
    const { database, recurringRules } = await setup();
    await insertRule(database, { startDate: "2026-05-01", eligibilityFloor: "2026-05-01" });

    const archived = await recurringRules.change({
      kind: "archive",
      ruleId: "rule-existing",
      expectedRevision: 1,
    });
    expect(archived).toMatchObject({ kind: "applied", revision: 2 });
    await expect(recurringRules.read({ kind: "list" })).resolves.toEqual({
      kind: "list",
      rules: [],
    });
    await expect(recurringRules.read({ kind: "list", filter: "archived" })).resolves.toMatchObject({
      kind: "list",
      rules: [{ id: "rule-existing", lifecycle: "archived" }],
    });

    const restored = await recurringRules.change({
      kind: "restore",
      ruleId: "rule-existing",
      expectedRevision: 2,
    });
    expect(restored).toMatchObject({ kind: "applied", revision: 3 });
    await expect(recurringRules.read({ kind: "upcoming" })).resolves.toMatchObject({
      kind: "upcoming",
      items: [{ rule: { id: "rule-existing" }, scheduledDate: "2026-05-01" }],
    });
  });

  it("continues settling independent Rules and reports unexpected failures", async () => {
    const { database, recurringRules } = await setup();
    await insertRule(database, {
      id: "rule-bad",
      name: "A bad Rule",
      startDate: "2026-04-15",
      eligibilityFloor: "2026-04-15",
    });
    await insertRule(database, {
      id: "rule-good",
      name: "B good Rule",
      startDate: "2026-04-15",
      eligibilityFloor: "2026-04-15",
    });
    await database.execAsync(`
      CREATE TRIGGER fail_bad_rule_occurrence
      BEFORE INSERT ON recurring_occurrences
      WHEN NEW.rule_id = 'rule-bad'
      BEGIN
        SELECT RAISE(ABORT, 'forced occurrence failure');
      END;
    `);

    let failure: unknown;
    try {
      await recurringRules.settle();
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(RecurringSettlementError);
    expect(failure).toMatchObject({
      report: {
        generatedCount: 1,
        rules: [
          { ruleId: "rule-bad", kind: "failed" },
          { ruleId: "rule-good", kind: "settled", generatedCount: 1 },
        ],
      },
    });
    await expect(
      database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM recurring_occurrences WHERE rule_id = ?",
        "rule-bad",
      ),
    ).resolves.toEqual({ count: 0 });
    await expect(
      database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM recurring_occurrences WHERE rule_id = ?",
        "rule-good",
      ),
    ).resolves.toEqual({ count: 1 });
    await expect(
      database.getFirstAsync<{ error: string }>(
        "SELECT last_settlement_error AS error FROM recurring_rules WHERE id = ?",
        "rule-bad",
      ),
    ).resolves.toEqual({ error: "forced occurrence failure" });
  });
});

async function insertCategory(database: SQLiteDatabase, categoryId: string): Promise<void> {
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES (?, 'Dining', 'expense', '#B48A7B', '🍽️', NULL, 0, ?, ?)`,
    categoryId,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}
