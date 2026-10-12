import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import type { DueSection } from "./due-model";

export type DueSectionPlan =
  /** Overdue and Today: each bill as a card with Mark paid. */
  | {
      readonly kind: "now";
      readonly key: string;
      readonly title: string;
      readonly late: boolean;
      readonly items: readonly V2DueOccurrence[];
    }
  /** This week and Next payday: rows; Next payday ends with the expected salary. */
  | {
      readonly kind: "list";
      readonly key: string;
      readonly title: string;
      readonly items: readonly V2DueOccurrence[];
      readonly salary: boolean;
    };

/** The sections the Due list draws, in order; empty ones are left out. */
export function dueSectionPlan(
  sections: readonly DueSection[],
  showSalary: boolean,
): DueSectionPlan[] {
  return sections.flatMap((section): DueSectionPlan[] => {
    const { key, title, items } = section;
    if (key === "overdue" || key === "today") {
      return items.length ? [{ kind: "now", key, title, late: key === "overdue", items }] : [];
    }
    const salary = key === "payday" && showSalary;
    return items.length || salary ? [{ kind: "list", key, title, items, salary }] : [];
  });
}
