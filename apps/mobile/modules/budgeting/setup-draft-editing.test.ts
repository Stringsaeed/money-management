import { describe, expect, it } from "@jest/globals";

import {
  moveSetupDraftCategory,
  removeSetupDraftCategory,
  toggleSetupDraftRollover,
  updateSetupDraftFundingAccounts,
} from "./setup-draft-editing";
import type { SetupDraft, SetupDraftEnvelope } from "./setup-draft-types";

const envelope = (
  overrides: Partial<SetupDraftEnvelope> & Pick<SetupDraftEnvelope, "id">,
): SetupDraftEnvelope => ({
  currency: "USD",
  name: "Groceries",
  icon: "🛒",
  color: "#8B9D83",
  categoryIds: ["cat-1"],
  positiveRollover: true,
  initialAssignmentMinor: 10_00,
  ...overrides,
});

const draft = (overrides: Partial<SetupDraft> = {}): SetupDraft => ({
  version: 1,
  id: "guided-envelope-setup",
  mode: "blank",
  step: "plan",
  workspaces: [
    {
      currency: "USD",
      fundingAccountIds: ["cash"],
      envelopes: [envelope({ id: "env-usd" })],
    },
    {
      currency: "AED",
      fundingAccountIds: [],
      envelopes: [envelope({ id: "env-aed", currency: "AED", positiveRollover: false })],
    },
  ],
  createdAt: "2026-08-19T08:00:00.000Z",
  updatedAt: "2026-08-19T08:00:00.000Z",
  ...overrides,
});

describe("updateSetupDraftFundingAccounts", () => {
  it("replaces funding account ids for the matching currency workspace only", () => {
    const next = updateSetupDraftFundingAccounts(draft(), "USD", ["checking", "savings"]);

    expect(next.workspaces[0]?.fundingAccountIds).toEqual(["checking", "savings"]);
    expect(next.workspaces[1]?.fundingAccountIds).toEqual([]);
  });

  it("rejects currencies that are not in the Setup Draft", () => {
    expect(() => updateSetupDraftFundingAccounts(draft(), "EUR", ["iban"])).toThrow(
      "EUR is not in this Setup Draft. Reload and try again.",
    );
  });
});

describe("toggleSetupDraftRollover", () => {
  it("flips positiveRollover for the target Envelope only", () => {
    const next = toggleSetupDraftRollover(draft(), "USD", "env-usd");

    expect(next.workspaces[0]?.envelopes).toEqual([
      expect.objectContaining({ id: "env-usd", positiveRollover: false }),
    ]);
    expect(next.workspaces[1]?.envelopes).toEqual([
      expect.objectContaining({ id: "env-aed", positiveRollover: false }),
    ]);

    const flippedBack = toggleSetupDraftRollover(next, "AED", "env-aed");
    expect(flippedBack.workspaces[1]?.envelopes).toEqual([
      expect.objectContaining({ id: "env-aed", positiveRollover: true }),
    ]);
  });

  it("rejects an Envelope that is missing from the currency workspace", () => {
    expect(() => toggleSetupDraftRollover(draft(), "USD", "missing-env")).toThrow(
      "Envelope missing-env is no longer in USD. Reload the Setup Draft.",
    );
  });
});

describe("removeSetupDraftCategory", () => {
  it("removes the category from the target Envelope only", () => {
    const base = draft({
      workspaces: [
        {
          currency: "USD",
          fundingAccountIds: ["cash"],
          envelopes: [
            envelope({ id: "env-usd", categoryIds: ["cat-1", "cat-2"] }),
            envelope({ id: "env-other", categoryIds: ["cat-2", "cat-3"] }),
          ],
        },
        {
          currency: "AED",
          fundingAccountIds: [],
          envelopes: [envelope({ id: "env-aed", currency: "AED", categoryIds: ["cat-2"] })],
        },
      ],
    });

    const next = removeSetupDraftCategory(base, "USD", "env-usd", "cat-2");

    expect(next.workspaces[0]?.envelopes).toEqual([
      expect.objectContaining({ id: "env-usd", categoryIds: ["cat-1"] }),
      expect.objectContaining({ id: "env-other", categoryIds: ["cat-2", "cat-3"] }),
    ]);
    expect(next.workspaces[1]?.envelopes).toEqual([
      expect.objectContaining({ id: "env-aed", categoryIds: ["cat-2"] }),
    ]);
  });

  it("rejects an Envelope that is missing from the currency workspace", () => {
    expect(() => removeSetupDraftCategory(draft(), "USD", "missing-env", "cat-1")).toThrow(
      "Envelope missing-env is no longer in USD. Reload the Setup Draft.",
    );
  });
});

describe("moveSetupDraftCategory", () => {
  it("moves a category onto the target Envelope and clears it from others", () => {
    const base = draft({
      workspaces: [
        {
          currency: "USD",
          fundingAccountIds: ["cash"],
          envelopes: [
            envelope({ id: "env-usd", categoryIds: ["cat-1"] }),
            envelope({ id: "env-other", categoryIds: ["cat-2", "cat-3"] }),
          ],
        },
        {
          currency: "AED",
          fundingAccountIds: [],
          envelopes: [envelope({ id: "env-aed", currency: "AED", categoryIds: ["cat-2"] })],
        },
      ],
    });

    const next = moveSetupDraftCategory(base, "USD", "cat-2", "env-usd");

    expect(next.workspaces[0]?.envelopes).toEqual([
      expect.objectContaining({ id: "env-usd", categoryIds: ["cat-1", "cat-2"] }),
      expect.objectContaining({ id: "env-other", categoryIds: ["cat-3"] }),
    ]);
    // Implementation clears the category from every workspace envelope.
    expect(next.workspaces[1]?.envelopes).toEqual([
      expect.objectContaining({ id: "env-aed", categoryIds: [] }),
    ]);
  });

  it("rejects an Envelope that is missing from the currency workspace", () => {
    expect(() => moveSetupDraftCategory(draft(), "USD", "cat-1", "missing-env")).toThrow(
      "Envelope missing-env is no longer in USD. Reload the Setup Draft.",
    );
  });
});
