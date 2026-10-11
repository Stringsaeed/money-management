import { useEffect } from "react";

import { useBudgetingOff } from "@/features/feature-flags";

import { cancelBudgetReminders, identityReminderPrefix } from "./notifications";

const warn = (cause: unknown) =>
  console.warn("Budget reminders of a signed-out identity could not be cancelled.", cause);

/**
 * Budget reminders belong to the signed-in identity: another identity's are cancelled when this
 * one starts (a sign-out the app did not see), and this one's when it ends (sign-out or switch).
 * While Budgeting is off (PostHog flag) this identity's are cancelled too; the data is untouched.
 */
export function useBudgetReminderOwner(identityKey: string): void {
  const budgetingOff = useBudgetingOff();
  useEffect(() => {
    const prefix = identityReminderPrefix(identityKey);
    cancelBudgetReminders((identifier) => !identifier.startsWith(prefix)).catch(warn);
    return () => {
      cancelBudgetReminders((identifier) => identifier.startsWith(prefix)).catch(warn);
    };
  }, [identityKey]);

  useEffect(() => {
    if (!budgetingOff) return;
    const prefix = identityReminderPrefix(identityKey);
    cancelBudgetReminders((identifier) => identifier.startsWith(prefix)).catch(warn);
  }, [budgetingOff, identityKey]);
}
