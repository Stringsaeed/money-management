import { describe, expect, it } from "@jest/globals";

import { planMembershipRevocation } from "./plan-membership-revocation";

const setOf = (...ids: string[]) => new Set(ids);

describe("planMembershipRevocation", () => {
  it("returns null when memberships are unchanged and enrollment still listed", () => {
    expect(
      planMembershipRevocation({
        previousHouseholdIds: setOf("hh-1"),
        currentHouseholdIds: setOf("hh-1"),
        enrolledHouseholdId: "hh-1",
        selection: { kind: "household", householdId: "hh-1" },
      }),
    ).toBeNull();
  });

  it("clears Household sync and selection when the enrolled selected membership disappears", () => {
    expect(
      planMembershipRevocation({
        previousHouseholdIds: setOf("hh-1"),
        currentHouseholdIds: setOf(),
        enrolledHouseholdId: "hh-1",
        selection: { kind: "household", householdId: "hh-1" },
      }),
    ).toEqual({
      clearHouseholdSync: true,
      clearHouseholdSelection: true,
    });
  });

  it("clears Household sync but leaves Personal selection alone", () => {
    expect(
      planMembershipRevocation({
        previousHouseholdIds: setOf("hh-1"),
        currentHouseholdIds: setOf(),
        enrolledHouseholdId: "hh-1",
        selection: { kind: "personal" },
      }),
    ).toEqual({
      clearHouseholdSync: true,
      clearHouseholdSelection: false,
    });
  });

  it("clears only selection when a non-enrolled selected Household is removed", () => {
    expect(
      planMembershipRevocation({
        previousHouseholdIds: setOf("hh-1", "hh-2"),
        currentHouseholdIds: setOf("hh-2"),
        enrolledHouseholdId: "hh-2",
        selection: { kind: "household", householdId: "hh-1" },
      }),
    ).toEqual({
      clearHouseholdSync: false,
      clearHouseholdSelection: true,
    });
  });

  it("clears sync when enrollment is lost even if previous snapshot was empty", () => {
    expect(
      planMembershipRevocation({
        previousHouseholdIds: setOf(),
        currentHouseholdIds: setOf("hh-other"),
        enrolledHouseholdId: "hh-1",
        selection: { kind: "personal" },
      }),
    ).toEqual({
      clearHouseholdSync: true,
      clearHouseholdSelection: false,
    });
  });
});
