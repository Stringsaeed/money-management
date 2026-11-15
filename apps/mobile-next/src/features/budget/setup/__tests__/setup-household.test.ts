import type { HouseholdDetail } from "@/features/household/household-client";

import { inPairs, rolesLine, shareTiles } from "../setup-household";

type Member = HouseholdDetail["members"][number];

const member = (userId: string, userName: string, overrides: Partial<Member> = {}): Member => ({
  membershipId: `m-${userId}`,
  userId,
  userName,
  userEmail: `${userId}@example.com`,
  role: "member",
  status: "active",
  joinedAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

const household = (
  members: Member[],
  role: HouseholdDetail["role"] = "admin",
): HouseholdDetail => ({
  householdId: "h",
  name: "Home",
  role,
  joinedAt: "2026-10-01T00:00:00.000Z",
  members,
});

describe("household setup", () => {
  const home = household([
    member("sara", "Sara Ali"),
    member("me", "Mo", { role: "admin" }),
    member("gone", "Gone", { status: "inactive" }),
  ]);

  it("puts You first and leaves inactive members out", () => {
    expect(shareTiles(home, "me")).toEqual([
      { userId: "me", name: "You", initial: "Y", isYou: true },
      { userId: "sara", name: "Sara Ali", initial: "S", isYou: false },
    ]);
    expect(inPairs([1, 2, 3])).toEqual([[1, 2], [3]]);
  });

  it("says what members may do and who changes the plan", () => {
    expect(rolesLine(home, "me")).toBe(
      "Sara can add spending, mark bills paid and move money. Only you change plan amounts.",
    );
    expect(rolesLine(household([member("me", "Mo")], "admin"), "me")).toBeNull();
    expect(
      rolesLine(
        household([member("me", "Mo"), member("v", "Vic", { role: "viewer" })], "member"),
        "me",
      ),
    ).toBe("Vic can view the budget. Only admins change plan amounts.");
  });
});
