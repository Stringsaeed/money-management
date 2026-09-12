import { describe, expect, it } from "@jest/globals";

import { REQUIRED_BUDGETING_COLUMNS } from "./budgeting-schema";

describe("REQUIRED_BUDGETING_COLUMNS", () => {
  it("locks required columns per budgeting table", () => {
    expect(REQUIRED_BUDGETING_COLUMNS).toEqual({
      assignments: [
        "id",
        "currency",
        "budget_period",
        "source_envelope_id",
        "destination_envelope_id",
        "amount_minor",
        "reverses_assignment_id",
        "created_at",
      ],
      budget_workspaces: ["currency", "activation_period", "created_at", "updated_at"],
      category_mappings: [
        "category_id",
        "envelope_id",
        "effective_from_period",
        "effective_to_period",
        "created_at",
      ],
      envelopes: [
        "id",
        "currency",
        "name",
        "icon",
        "color",
        "lifecycle",
        "sort_order",
        "created_at",
        "updated_at",
      ],
      funding_memberships: [
        "account_id",
        "currency",
        "effective_from_period",
        "effective_to_period",
        "created_at",
      ],
      rollover_settings: ["envelope_id", "effective_from_period", "positive_rollover", "created_at"],
      setup_drafts: ["id", "payload", "created_at", "updated_at"],
    });
  });
});
