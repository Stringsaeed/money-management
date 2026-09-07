import {
  createTestLedgerCollections,
  preloadTestLedgerCollections,
} from "@/modules/ledger-db/test-collections";

import { createSyncedRecurringRules } from "./synced";

const now = new Date("2026-09-07T08:00:00.000Z");
const draft = {
  name: "Rent",
  type: "expense" as const,
  amountMinor: 120_000,
  currency: "USD",
  accountId: "account-1",
  toAccountId: null,
  categoryId: "category-1",
  description: "Monthly rent",
  frequency: "month" as const,
  intervalCount: 1,
  startDate: "2026-09-10",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
};

describe("synced Recurring Rules", () => {
  it("reads rules and upcoming dates from PowerSync collections", async () => {
    const collections = createTestLedgerCollections({
      recurringRules: [
        {
          id: "rule-1",
          household_id: "household-1",
          name: draft.name,
          type: draft.type,
          amount_minor: draft.amountMinor,
          currency: draft.currency,
          account_id: draft.accountId,
          to_account_id: null,
          category_id: draft.categoryId,
          description: draft.description,
          frequency: draft.frequency,
          interval_count: 1,
          start_date: draft.startDate,
          end_date: null,
          end_count: null,
          time_zone: draft.timeZone,
          lifecycle: "active",
          health: "ready",
          attention_reasons: "[]",
          attention_details: null,
          eligibility_floor: draft.startDate,
          revision: 1,
          lifecycle_changed_at: null,
          health_changed_at: null,
          last_settlement_attempt_at: null,
          last_settlement_error: null,
          created_by: "user-1",
          updated_by: "user-1",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ],
    });
    await preloadTestLedgerCollections(collections);
    const recurring = createSyncedRecurringRules({
      collections,
      householdId: "household-1",
      userId: "user-1",
      clock: { now: () => now, localDate: () => "2026-09-07" },
      nextId: () => "unused",
    });

    await expect(recurring.read({ kind: "list" })).resolves.toMatchObject({
      kind: "list",
      rules: [{ id: "rule-1", name: "Rent" }],
    });
    await expect(recurring.read({ kind: "upcoming", limit: 3 })).resolves.toMatchObject({
      kind: "upcoming",
      items: [{ rule: { id: "rule-1" }, scheduledDate: "2026-09-10" }],
    });
  });

  it("optimistically inserts a create through the PowerSync collection", async () => {
    const collections = createTestLedgerCollections();
    await preloadTestLedgerCollections(collections);
    const ids = ["rule-new", "command-new"];
    const recurring = createSyncedRecurringRules({
      collections,
      householdId: "household-1",
      userId: "user-1",
      clock: { now: () => now, localDate: () => "2026-09-07" },
      nextId: () => ids.shift() ?? "unexpected",
    });

    await expect(recurring.change({ kind: "create", rule: draft })).resolves.toMatchObject({
      kind: "applied",
      ruleId: "rule-new",
      revision: 1,
    });
    expect(collections.recurringRules.get("rule-new")).toMatchObject({
      household_id: "household-1",
      name: "Rent",
      revision: 1,
    });
  });
});
