import type { SQLiteDatabase } from "@/db/sqlite";

import {
  createTestEnvelope,
  insertEnvelopeCategories,
  setupEnvelopeWorkspace,
} from "./envelope-test-support";

export async function setupAssignmentWorkspace(): Promise<SQLiteDatabase> {
  const database = await setupEnvelopeWorkspace();
  await insertEnvelopeCategories(database, [
    ["category-one", "One"],
    ["category-two", "Two"],
  ]);
  await createTestEnvelope(database, {
    id: "envelope-one",
    name: "One",
    categoryIds: ["category-one"],
  });
  await createTestEnvelope(database, {
    id: "envelope-two",
    name: "Two",
    categoryIds: ["category-two"],
  });
  return database;
}

export const moveMoneyRequest = (overrides: Record<string, unknown> = {}) => ({
  id: "assignment-1",
  currency: "USD",
  period: "2026-08",
  sourceEnvelopeId: null as string | null,
  destinationEnvelopeId: "envelope-one" as string | null,
  amountMinor: 25_00,
  now: "2026-08-19T09:00:00.000Z",
  ...overrides,
});
