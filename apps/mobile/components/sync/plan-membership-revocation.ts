import type { LedgerSelection } from "@/modules/access/types";

/** Side-effect plan when listMine memberships shrink (confirmed Household removal). */
export type MembershipRevocationPlan = {
  readonly clearHouseholdSync: boolean;
  readonly clearHouseholdSelection: boolean;
};

/**
 * Pure planner for MembershipRevocationCleanup: stop Household sync uploads/cache
 * when enrollment is lost, and clear a stale Household selection. Does not clear
 * identity claim or Personal selection — those stay until explicit sign-out.
 */
export function planMembershipRevocation(input: {
  readonly previousHouseholdIds: ReadonlySet<string>;
  readonly currentHouseholdIds: ReadonlySet<string>;
  readonly enrolledHouseholdId: string | null | undefined;
  readonly selection: LedgerSelection;
}): MembershipRevocationPlan | null {
  const removed = [...input.previousHouseholdIds].filter(
    (id) => !input.currentHouseholdIds.has(id),
  );
  const enrolled = input.enrolledHouseholdId ?? null;
  const lostEnrollment = enrolled != null && !input.currentHouseholdIds.has(enrolled);
  if (removed.length === 0 && !lostEnrollment) return null;

  return {
    clearHouseholdSync: lostEnrollment || (enrolled != null && removed.includes(enrolled)),
    clearHouseholdSelection:
      input.selection.kind === "household" &&
      !input.currentHouseholdIds.has(input.selection.householdId),
  };
}
