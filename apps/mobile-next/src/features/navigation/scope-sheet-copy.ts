import type { HouseholdDetail } from "@/features/household/household-client";

/** Everyone else in the household, by first name, in the order the server lists them. */
export function otherMemberNames(
  household: Pick<HouseholdDetail, "members">,
  myUserId: string | null,
): string[] {
  return household.members
    .filter((member) => member.status === "active" && member.userId !== myUserId)
    .map((member) => member.userName.trim().split(/\s+/)[0] ?? member.userName)
    .filter((name) => name !== "");
}

/** "Sara", "Sara and Omar", or "Sara, Omar +2". */
export function nameList(names: readonly string[]): string {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

/** The Household option's line: who shares it. */
export function householdSub(others: readonly string[]): string {
  return others.length === 0
    ? "Shared accounts only"
    : `With ${nameList(others)} · shared accounts only`;
}

/** The Household members link's meta: "You, Sara". */
export function membersMeta(others: readonly string[]): string {
  return ["You", ...others].join(", ");
}

/** The line under the choices: what switching does, and who sees which ledger. */
export function scopeNote(hasHousehold: boolean, others: readonly string[]): string {
  if (!hasHousehold) return "Every tab follows this switch.";
  if (others.length === 0) return "Every tab follows this switch. The two ledgers never mix.";
  const verb = others.length === 1 ? "sees" : "see";
  return `Every tab follows this switch. The two ledgers never mix, and ${nameList(others)} only ${verb} Household.`;
}
