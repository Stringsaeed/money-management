import type { V2BudgetActivityItem } from "@trove/api/v2/contracts";

const NOT_PLANNED = "Not planned yet";
const UNKNOWN_PERSON = "Someone";

const personName = (item: V2BudgetActivityItem): string =>
  item.createdByName?.trim() || UNKNOWN_PERSON;

/** What the money did, after "<who> ": a cover, a pay-back, a plan, a take-out, or a move. */
function moveClause(
  from: string | null,
  to: string | null,
  reason: V2BudgetActivityItem["reason"],
  amount: string,
): string {
  const source = from ?? NOT_PLANNED;
  if (reason === "cover") {
    // C1 pays last period's overspend back into Not planned yet.
    return to
      ? `covered ${to} with ${amount} from ${source}`
      : `paid back ${amount} of last month's overspend from ${source}`;
  }
  if (from === null && to) return `planned ${amount} for ${to}`;
  if (to === null && from) return `took ${amount} out of ${from}`;
  return `moved ${amount} from ${source} to ${to ?? NOT_PLANNED}`;
}

/** H3: one money move as a sentence, e.g. "Sara moved AED 100.00 from Dining to Groceries". */
export function activitySentence(
  item: V2BudgetActivityItem,
  money: (minor: number) => string,
): string {
  const clause = moveClause(item.fromName, item.toName, item.reason, money(item.amountMinor));
  return `${personName(item)} ${clause}`;
}

/** The mover's initial for an avatar disc, e.g. "S"; "Someone" gives "S". */
export function activityInitial(item: V2BudgetActivityItem): string {
  return personName(item).charAt(0).toUpperCase();
}
