import { afterEach, describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "@/db/sqlite";

import { migrateBudgeting } from "@/db/budgeting-migration";
import { migrateCategoryLifecycle } from "@/db/category-lifecycle-migration";
import { migrateRecurringRules } from "@/db/recurring-rules-migration";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { archiveCategory, restoreCategory } from "./category-lifecycle";
import { createFutureCategoryMappingCommand } from "./future-category-mapping";

const databases: { database: SQLiteDatabase; close: VoidFunction }[] = [];

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

describe("confirmed future Category Mapping", () => {
  it("requires a bound one-time confirmation before remapping a restored Category", async () => {
    const database = await setup();
    const now = new Date("2026-08-18T08:00:00.000Z");
    const command = createFutureCategoryMappingCommand({
      database,
      now: () => now,
      nextConfirmationToken: () => "mapping-confirmation-1",
    });
    const intent = {
      categoryId: "category-dining",
      envelopeId: "envelope-food",
      effectiveFromPeriod: "2026-09",
    } as const;

    await expect(command.change(intent)).resolves.toEqual({
      kind: "confirmation_required",
      confirmationToken: "mapping-confirmation-1",
      preview: { ...intent, currentPeriod: "2026-08" },
    });
    await expect(mappingCount(database, "2026-09")).resolves.toBe(0);
    await expect(
      command.change({
        ...intent,
        envelopeId: "envelope-other",
        confirmationToken: "mapping-confirmation-1",
      }),
    ).resolves.toEqual({ kind: "invalid_confirmation" });
    await expect(mappingCount(database, "2026-09")).resolves.toBe(0);

    const preview = await command.change(intent);
    if (preview.kind !== "confirmation_required") throw new Error("Expected confirmation.");
    await expect(
      command.change({ ...intent, confirmationToken: preview.confirmationToken }),
    ).resolves.toEqual({ kind: "applied", effects: ["projections"] });
    await expect(mappingCount(database, "2026-09")).resolves.toBe(1);
    await expect(
      command.change({ ...intent, confirmationToken: preview.confirmationToken }),
    ).resolves.toEqual({ kind: "invalid_confirmation" });
  });

  it("rejects a stale confirmation when the derived current period advances", async () => {
    const database = await setup();
    let now = new Date("2026-08-31T08:00:00.000Z");
    const command = createFutureCategoryMappingCommand({
      database,
      now: () => now,
      nextConfirmationToken: () => "mapping-confirmation-stale",
    });
    const intent = {
      categoryId: "category-dining",
      envelopeId: "envelope-food",
      effectiveFromPeriod: "2026-09",
    } as const;
    const preview = await command.change(intent);
    if (preview.kind !== "confirmation_required") throw new Error("Expected confirmation.");
    now = new Date("2026-09-01T08:00:00.000Z");

    await expect(
      command.change({ ...intent, confirmationToken: preview.confirmationToken }),
    ).rejects.toThrow("must begin in a future Budget Period");
    await expect(mappingCount(database, "2026-09")).resolves.toBe(0);
  });

  it("rejects an expired confirmation token", async () => {
    const database = await setup();
    let now = new Date("2026-08-18T08:00:00.000Z");
    const command = createFutureCategoryMappingCommand({
      database,
      now: () => now,
      nextConfirmationToken: () => "mapping-confirmation-expired",
    });
    const intent = {
      categoryId: "category-dining",
      envelopeId: "envelope-food",
      effectiveFromPeriod: "2026-09",
    } as const;
    const preview = await command.change(intent);
    if (preview.kind !== "confirmation_required") throw new Error("Expected confirmation.");
    now = new Date("2026-08-18T08:06:00.000Z");

    await expect(
      command.change({ ...intent, confirmationToken: preview.confirmationToken }),
    ).resolves.toEqual({ kind: "invalid_confirmation" });
    await expect(mappingCount(database, "2026-09")).resolves.toBe(0);
  });
});

async function setup(): Promise<SQLiteDatabase> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  const database = testDatabase.database;
  await applyLegacyMigrations(database);
  await migrateRecurringRules(database, {
    timeZone: "Asia/Dubai",
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  await migrateBudgeting(database);
  await migrateCategoryLifecycle(database);
  const createdAt = "2026-01-01T00:00:00.000Z";
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES ('category-dining', 'Dining', 'expense', '#B48A7B', '🍽️', NULL, 0, ?, ?)`,
    createdAt,
    createdAt,
  );
  await database.runAsync(
    `INSERT INTO budget_workspaces (currency, activation_period, created_at, updated_at)
     VALUES ('USD', '2026-08', ?, ?)`,
    createdAt,
    createdAt,
  );
  for (const [id, name] of [
    ["envelope-food", "Food"],
    ["envelope-other", "Other"],
  ]) {
    await database.runAsync(
      `INSERT INTO envelopes (
        id, currency, name, icon, color, lifecycle, sort_order, created_at, updated_at
      ) VALUES (?, 'USD', ?, '🍲', '#B48A7B', 'active', 0, ?, ?)`,
      id,
      name,
      createdAt,
      createdAt,
    );
  }
  await archiveCategory(database, {
    categoryId: "category-dining",
    localDate: "2026-08-18",
    now: "2026-08-18T08:00:00.000Z",
  });
  await restoreCategory(database, {
    categoryId: "category-dining",
    now: "2026-08-18T08:01:00.000Z",
  });
  return database;
}

async function mappingCount(database: SQLiteDatabase, period: string): Promise<number> {
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM category_mappings WHERE effective_from_period = ?",
    period,
  );
  return row?.count ?? 0;
}
