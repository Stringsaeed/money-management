import { describe, expect, it } from "@jest/globals";

import { updateSetupDraftFundingAccounts } from "./setup-draft-editing";
import type { SetupDraft } from "./setup-draft-types";

const draft = (overrides: Partial<SetupDraft> = {}): SetupDraft => ({
  version: 1,
  id: "guided-envelope-setup",
  mode: "blank",
  step: "plan",
  workspaces: [
    {
      currency: "USD",
      fundingAccountIds: ["cash"],
      envelopes: [],
    },
    {
      currency: "AED",
      fundingAccountIds: [],
      envelopes: [],
    },
  ],
  createdAt: "2026-08-19T08:00:00.000Z",
  updatedAt: "2026-08-19T08:00:00.000Z",
  ...overrides,
});

describe("updateSetupDraftFundingAccounts", () => {
  it("replaces funding account ids for the matching currency workspace only", () => {
    const next = updateSetupDraftFundingAccounts(draft(), "USD", ["checking", "savings"]);

    expect(next.workspaces).toEqual([
      {
        currency: "USD",
        fundingAccountIds: ["checking", "savings"],
        envelopes: [],
      },
      {
        currency: "AED",
        fundingAccountIds: [],
        envelopes: [],
      },
    ]);
  });

  it("rejects currencies that are not in the Setup Draft", () => {
    expect(() => updateSetupDraftFundingAccounts(draft(), "EUR", ["iban"])).toThrow(
      "EUR is not in this Setup Draft. Reload and try again.",
    );
  });
});
