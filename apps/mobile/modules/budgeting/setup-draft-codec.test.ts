import { describe, expect, it } from "@jest/globals";

import { UnreadableSetupDraftError, decodeSetupDraft } from "./setup-draft-codec";
import { GUIDED_SETUP_DRAFT_ID } from "./setup-draft-types";

const validDraft = {
  version: 1,
  id: GUIDED_SETUP_DRAFT_ID,
  mode: "suggested",
  step: "plan",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T01:00:00.000Z",
  workspaces: [
    {
      currency: "USD",
      fundingAccountIds: ["a1"],
      envelopes: [
        {
          id: "e1",
          currency: "USD",
          name: "Groceries",
          icon: "cart",
          color: "#111111",
          categoryIds: ["c1"],
          positiveRollover: true,
          initialAssignmentMinor: 1000,
        },
      ],
    },
  ],
};

describe("decodeSetupDraft", () => {
  it("round-trips a valid guided Setup Draft", () => {
    expect(decodeSetupDraft(validDraft)).toEqual(validDraft);
  });

  it("rejects wrong version, id, mode, step, or non-object payloads", () => {
    expect(() => decodeSetupDraft(null)).toThrow(UnreadableSetupDraftError);
    expect(() => decodeSetupDraft({ ...validDraft, version: 2 })).toThrow(UnreadableSetupDraftError);
    expect(() => decodeSetupDraft({ ...validDraft, id: "other" })).toThrow(UnreadableSetupDraftError);
    expect(() => decodeSetupDraft({ ...validDraft, mode: "custom" })).toThrow(
      UnreadableSetupDraftError,
    );
    expect(() => decodeSetupDraft({ ...validDraft, step: "done" })).toThrow(
      UnreadableSetupDraftError,
    );
  });

  it("rejects workspaces or envelopes with unsafe assignment minors", () => {
    const bad = structuredClone(validDraft);
    bad.workspaces[0].envelopes[0].initialAssignmentMinor = 1.5;
    expect(() => decodeSetupDraft(bad)).toThrow(UnreadableSetupDraftError);
  });
});
