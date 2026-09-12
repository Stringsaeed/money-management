import { describe, expect, it } from "@jest/globals";

import { identityFromUser, sameIdentity } from "./identity";

describe("identityFromUser", () => {
  it("maps WorkOS user fields onto Identity", () => {
    expect(identityFromUser({ id: "user-1", email: "ada@trove.ing", name: "Ada" })).toEqual({
      userId: "user-1",
      email: "ada@trove.ing",
      displayName: "Ada",
    });
  });

  it("uses an empty display name when name is absent", () => {
    expect(identityFromUser({ id: "user-1", email: "ada@trove.ing", name: null })).toEqual({
      userId: "user-1",
      email: "ada@trove.ing",
      displayName: "",
    });
  });
});

describe("sameIdentity", () => {
  const base = {
    userId: "user-1",
    email: "ada@trove.ing",
    displayName: "Ada",
  };

  it("matches only when userId, email, and displayName all equal", () => {
    expect(sameIdentity(base, { ...base })).toBe(true);
  });

  it("rejects a different userId (identity switch)", () => {
    expect(sameIdentity(base, { ...base, userId: "user-2" })).toBe(false);
  });

  it("rejects email or displayName drift for the same userId", () => {
    expect(sameIdentity(base, { ...base, email: "other@trove.ing" })).toBe(false);
    expect(sameIdentity(base, { ...base, displayName: "Other" })).toBe(false);
  });
});
