import { householdLedgerBinding } from "@/modules/ledger-data-source/provider";
import { createSyncedTransactionLedger } from "@/modules/ledger-db/ledger";
import {
  createTestLedgerCollections,
  preloadTestLedgerCollections,
} from "@/modules/ledger-db/test-collections";
import { applyLegacyMigrations, createTestSQLiteDatabase } from "@/tests/test-utils/sqlite";

import { createSyncedBudgetingCoordinator } from "./synced";

const timestamp = "2026-09-07T08:00:00.000Z";
const audit = {
  version: 0,
  created_by: "user-1",
  updated_by: "user-1",
  created_at: timestamp,
  updated_at: timestamp,
};

describe("synced budgeting coordinator", () => {
  it("reads workspace, mappings, rollover, and assignment history from PowerSync collections", async () => {
    const sqlite = createTestSQLiteDatabase();
    await applyLegacyMigrations(sqlite.database);
    const collections = createTestLedgerCollections({
      budgetWorkspaces: [
        {
          id: "workspace-usd",
          household_id: "household-1",
          currency: "USD",
          activation_period: "2026-09",
          ...audit,
        },
      ],
      categories: [
        {
          id: "category-1",
          ledger_id: "household-1",
          household_id: "household-1",
          name: "Housing",
          type: "expense",
          color: "#8B9D83",
          icon: "🏠",
          parent_id: null,
          sort_order: 0,
          lifecycle: "active",
          lifecycle_changed_at: null,
          ...audit,
        },
      ],
      envelopes: [
        {
          id: "envelope-1",
          household_id: "household-1",
          currency: "USD",
          name: "Needs",
          icon: "📦",
          color: "#8B9D83",
          lifecycle: "active",
          sort_order: 0,
          ...audit,
        },
      ],
      categoryMappings: [
        {
          id: "mapping-1",
          household_id: "household-1",
          category_id: "category-1",
          envelope_id: "envelope-1",
          effective_from_period: "2026-09",
          ...audit,
        },
      ],
      rolloverSettings: [
        {
          id: "rollover-1",
          household_id: "household-1",
          envelope_id: "envelope-1",
          positive_rollover: 0,
          effective_from_period: "2026-09",
          ...audit,
        },
      ],
      assignments: [
        assignment("assignment-original", null),
        assignment("assignment-reversal", "assignment-original"),
        assignment("assignment-replacement", "assignment-reversal"),
      ],
    });
    await preloadTestLedgerCollections(collections);
    const ledger = createSyncedTransactionLedger({
      binding: householdLedgerBinding("household-1"),
      userId: "user-1",
      dbIdentity: sqlite.database,
      collections,
      newId: () => "unused",
      now: () => timestamp,
    });
    const budgeting = createSyncedBudgetingCoordinator({
      database: sqlite.database,
      householdId: "household-1",
      userId: "user-1",
      ledger,
    });

    await expect(budgeting.getWorkspaceSelection()).resolves.toEqual({
      workspaces: [{ currency: "USD", activationPeriod: "2026-09" }],
      homeCurrency: "USD",
      hasExplicitHomeCurrency: false,
      selectedCurrency: "USD",
    });
    await expect(
      budgeting.getEnvelopeFormOptions({ currency: "USD", period: "2026-09" }),
    ).resolves.toEqual([
      expect.objectContaining({ id: "category-1", mappedEnvelopeId: "envelope-1" }),
    ]);
    await expect(
      budgeting.getAssignmentHistory({ currency: "USD", period: "2026-09" }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "assignment-original", kind: "original" }),
        expect.objectContaining({ id: "assignment-reversal", kind: "reversal" }),
        expect.objectContaining({ id: "assignment-replacement", kind: "replacement" }),
      ]),
    );

    ledger.dispose();
    sqlite.close();
  });
});

const assignment = (id: string, reversesAssignmentId: string | null) => ({
  id,
  household_id: "household-1",
  currency: "USD",
  budget_period: "2026-09",
  source_envelope_id: null,
  destination_envelope_id: "envelope-1",
  amount_minor: 100,
  reverses_assignment_id: reversesAssignmentId,
  ...audit,
});
