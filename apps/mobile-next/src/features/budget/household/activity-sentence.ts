import type { V2BudgetActivityItem } from "@trove/api/v2/contracts";

const NOT_PLANNED = "Not planned yet";
const UNKNOWN_PERSON = "Someone";

const personName = (item: V2BudgetActivityItem): string =>
  item.createdByName?.trim() || UNKNOWN_PERSON;

/** H3: one money move as a sentence, e.g. "Sara moved AED 100.00 from Dining to Groceries". */
export function activitySentence(
  item: V2BudgetActivityItem,
  money: (minor: number) => string,
): string {
  const who = personName(item);
  const amount = money(item.amountMinor);
  const { fromName: from, toName: to } = item;
  if (item.reason === "cover" && to) {
    return `${who} covered ${to} with ${amount} from ${from ?? NOT_PLANNED}`;
  }
  if (from === null && to) return `${who} planned ${amount} for ${to}`;
  if (to === null && from) return `${who} took ${amount} out of ${from}`;
  return `${who} moved ${amount} from ${from ?? NOT_PLANNED} to ${to ?? NOT_PLANNED}`;
}
