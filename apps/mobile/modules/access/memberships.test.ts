import { describe, expect, it } from "@jest/globals";

import { roleLabel, toMembershipSummary } from "./memberships";

describe("toMembershipSummary", () => {
  it("maps a valid admin row and ISO-serializes Date joinedAt", () => {
    expect(
      toMembershipSummary({
        householdId: "hh_1",
        name: "Ada Home",
        role: "admin",
        joinedAt: new Date("2026-03-01T12:00:00.000Z"),
      }),
    ).toEqual({
      householdId: "hh_1",
      name: "Ada Home",
      role: "admin",
      joinedAt: "2026-03-01T12:00:00.000Z",
    });
  });

  it("keeps string joinedAt and accepts member and viewer roles", () => {
    expect(
      toMembershipSummary({
        householdId: "hh_2",
        name: "Shared",
        role: "member",
        joinedAt: "2026-04-01T00:00:00.000Z",
      }),
    ).toEqual({
      householdId: "hh_2",
      name: "Shared",
      role: "member",
      joinedAt: "2026-04-01T00:00:00.000Z",
    });
    expect(
      toMembershipSummary({
        householdId: "hh_3",
        name: "Read Only",
        role: "viewer",
        joinedAt: "2026-05-01T00:00:00.000Z",
      }),
    ).toEqual({
      householdId: "hh_3",
      name: "Read Only",
      role: "viewer",
      joinedAt: "2026-05-01T00:00:00.000Z",
    });
  });

  it("returns null for unknown role slugs so listMine cannot invent capabilities", () => {
    expect(
      toMembershipSummary({
        householdId: "hh_x",
        name: "Bad",
        role: "owner",
        joinedAt: "2026-03-01T00:00:00.000Z",
      }),
    ).toBeNull();
    expect(
      toMembershipSummary({
        householdId: "hh_x",
        name: "Bad",
        role: "",
        joinedAt: "2026-03-01T00:00:00.000Z",
      }),
    ).toBeNull();
  });
});

describe("roleLabel", () => {
  it("labels each HouseholdRole for membership UI", () => {
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("member")).toBe("Member");
    expect(roleLabel("viewer")).toBe("Viewer");
  });
});
