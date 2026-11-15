import type { HouseholdDetail } from "@/features/household/household-client";

import {
  householdSub,
  membersMeta,
  nameList,
  otherMemberNames,
  scopeNote,
} from "../scope-sheet-copy";

const member = (
  userId: string,
  userName: string,
  status: "active" | "inactive" | "pending" = "active",
): HouseholdDetail["members"][number] => ({
  membershipId: `m-${userId}`,
  userId,
  userName,
  userEmail: `${userId}@example.com`,
  role: "member",
  status,
  joinedAt: "2026-01-01T00:00:00.000Z",
});

describe("otherMemberNames", () => {
  it("lists active members other than me by first name", () => {
    const household = {
      members: [
        member("me", "Mo Ibrahim"),
        member("sara", "Sara Ali"),
        member("omar", "Omar", "pending"),
      ],
    };
    expect(otherMemberNames(household, "me")).toEqual(["Sara"]);
  });

  it("lists everyone when it can't tell who I am", () => {
    expect(otherMemberNames({ members: [member("a", "Ana"), member("b", "Bo")] }, null)).toEqual([
      "Ana",
      "Bo",
    ]);
  });
});

describe("household copy", () => {
  it("names who shares the household", () => {
    expect(nameList(["Sara"])).toBe("Sara");
    expect(nameList(["Sara", "Omar"])).toBe("Sara and Omar");
    expect(nameList(["Sara", "Omar", "Ali", "Noor"])).toBe("Sara, Omar +2");
    expect(householdSub(["Sara"])).toBe("With Sara · shared accounts only");
    expect(householdSub([])).toBe("Shared accounts only");
    expect(membersMeta(["Sara"])).toBe("You, Sara");
  });

  it("explains the switch for each situation", () => {
    expect(scopeNote(false, [])).toBe("Every tab follows this switch.");
    expect(scopeNote(true, [])).toBe("Every tab follows this switch. The two ledgers never mix.");
    expect(scopeNote(true, ["Sara"])).toBe(
      "Every tab follows this switch. The two ledgers never mix, and Sara only sees Household.",
    );
    expect(scopeNote(true, ["Sara", "Omar"])).toContain("Sara and Omar only see Household");
  });
});
