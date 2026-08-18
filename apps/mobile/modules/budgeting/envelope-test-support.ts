import type { SQLiteDatabase } from "expo-sqlite";

import {
  insertBudgetAccount,
  setupBudgetingDatabase,
} from "@/modules/budgeting/budgeting-test-utils";

import { createBudgetingCoordinator } from "./budgeting";
import type { CreateEnvelopeRequest } from "./types";

export const envelopeTestDatabases: { close: VoidFunction }[] = [];

export function closeEnvelopeTestDatabases(): void {
  envelopeTestDatabases.splice(0).forEach(({ close }) => close());
}

export async function setupEnvelopeWorkspace(localDate = "2026-08-19"): Promise<SQLiteDatabase> {
  const testDatabase = await setupBudgetingDatabase();
  envelopeTestDatabases.push(testDatabase);
  await insertBudgetAccount(testDatabase.database, {
    id: "account-main",
    initialBalance: 100_00,
  });
  await createBudgetingCoordinator(testDatabase.database).activateWorkspace({
    currency: "USD",
    fundingAccountIds: ["account-main"],
    localDate,
    now: "2026-08-19T07:00:00.000Z",
  });
  return testDatabase.database;
}

export async function insertEnvelopeCategory(
  database: SQLiteDatabase,
  input: { id: string; name: string },
): Promise<void> {
  await database.runAsync(
    `INSERT INTO categories (
      id, name, type, color, icon, parent_id, sort_order, created_at, updated_at
    ) VALUES (?, ?, 'expense', '#B48A7B', '🏷️', NULL, 0, ?, ?)`,
    input.id,
    input.name,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z",
  );
}

export async function insertEnvelopeCategories(
  database: SQLiteDatabase,
  categories: readonly (readonly [id: string, name: string])[],
): Promise<void> {
  for (const [id, name] of categories) {
    await insertEnvelopeCategory(database, { id, name });
  }
}

export function createTestEnvelope(
  database: SQLiteDatabase,
  request: Pick<CreateEnvelopeRequest, "id" | "name" | "categoryIds"> &
    Partial<Omit<CreateEnvelopeRequest, "id" | "name" | "categoryIds">>,
) {
  return createBudgetingCoordinator(database).createEnvelope({
    currency: "USD",
    icon: "📦",
    color: "#8B9D83",
    positiveRollover: true,
    localDate: "2026-08-19",
    now: "2026-08-19T08:00:00.000Z",
    ...request,
  });
}
