import { describe, expect, it } from "@jest/globals";

import { claimFromFields } from "./claim-store";

describe("claimFromFields", () => {
  it("reads none when any required field is missing", () => {
    expect(
      claimFromFields({
        userId: null,
        email: "ada@trove.ing",
        displayName: "Ada",
        establishedAt: "t",
      }),
    ).toEqual({ kind: "none" });
    expect(
      claimFromFields({ userId: "u1", email: null, displayName: "Ada", establishedAt: "t" }),
    ).toEqual({ kind: "none" });
  });

  it("reads a held identity claim", () => {
    expect(
      claimFromFields({
        userId: "u1",
        email: "ada@trove.ing",
        displayName: "Ada",
        establishedAt: "2026-03-01T00:00:00.000Z",
      }),
    ).toEqual({
      kind: "held",
      user: { userId: "u1", email: "ada@trove.ing", displayName: "Ada" },
      establishedAt: "2026-03-01T00:00:00.000Z",
    });
  });
});
