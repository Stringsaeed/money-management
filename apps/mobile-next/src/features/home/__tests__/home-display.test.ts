import { describe, expect, it } from "@jest/globals";

import { homeIdentity, signedMinor } from "../home-display";

describe("signedMinor", () => {
  it("makes spending negative and keeps money in and transfers positive", () => {
    expect(signedMinor("expense", 1250)).toBe(-1250);
    expect(signedMinor("income", 1250)).toBe(1250);
    expect(signedMinor("transfer", 1250)).toBe(1250);
  });

  it("does not double-negate an already signed expense", () => {
    expect(signedMinor("expense", -1250)).toBe(-1250);
  });
});

describe("homeIdentity", () => {
  it("derives initials from a signed-in user's full name", () => {
    expect(
      homeIdentity({
        kind: "user",
        userId: "u1",
        workosUserId: "w1",
        email: "ada@example.com",
        name: "Ada Byron",
      }),
    ).toEqual({ name: "Ada", initials: "AB" });
  });

  it("falls back to the email when the name is empty", () => {
    expect(
      homeIdentity({
        kind: "user",
        userId: "u1",
        workosUserId: "w1",
        email: "ada@example.com",
        name: "",
      }).initials,
    ).toBe("A");
  });

  it("greets a guest as a friend", () => {
    expect(homeIdentity({ kind: "guest", guestSessionId: "g1" })).toEqual({
      name: "friend",
      initials: "G",
    });
  });
});
