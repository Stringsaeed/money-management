import { describe, expect, it } from "@jest/globals";

import { BUDGETING_TABLES } from "./budgeting-schema";

describe("BUDGETING_TABLES", () => {
  it("locks budgeting table name vocabulary", () => {
    expect(BUDGETING_TABLES).toEqual([
      "assignments",
      "budget_workspaces",
      "category_mappings",
      "envelopes",
      "funding_memberships",
      "rollover_settings",
      "setup_drafts",
    ]);
  });
});
