import { describe, expect, it } from "@jest/globals";

import { isImportManifestEmpty } from "./manifest-utils";

describe("isImportManifestEmpty", () => {
  it("returns true when every entity count is zero", () => {
    expect(
      isImportManifestEmpty({
        rowCounts: {
          account: 0,
          category: 0,
          transaction: 0,
          recurring_rule: 0,
          budget_workspace: 0,
          envelope: 0,
          category_mapping: 0,
          funding_membership: 0,
          rollover_setting: 0,
          assignment: 0,
          recurring_occurrence: 0,
        },
        transactionAmountMinorByAccount: {},
        contentDigest: "empty",
      }),
    ).toBe(true);
  });

  it("returns false when any entity has rows", () => {
    expect(
      isImportManifestEmpty({
        rowCounts: {
          account: 1,
          category: 0,
          transaction: 0,
          recurring_rule: 0,
          budget_workspace: 0,
          envelope: 0,
          category_mapping: 0,
          funding_membership: 0,
          rollover_setting: 0,
          assignment: 0,
          recurring_occurrence: 0,
        },
        transactionAmountMinorByAccount: {},
        contentDigest: "x",
      }),
    ).toBe(false);
  });
});
