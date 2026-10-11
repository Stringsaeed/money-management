import { useEffect } from "react";

import { cancelBudgetReminders, identityReminderPrefix } from "./notifications";

const warn = (cause: unknown) =>
  console.warn("Budget reminders of a signed-out identity could not be cancelled.", cause);

/**
 * Budget reminders belong to the signed-in identity: another identity's are cancelled when this
 * one starts (a sign-out the app did not see), and this one's when it ends (sign-out or switch).
 */
export function useBudgetReminderOwner(identityKey: string): void {
  useEffect(() => {
    const prefix = identityReminderPrefix(identityKey);
    cancelBudgetReminders((identifier) => !identifier.startsWith(prefix)).catch(warn);
    return () => {
      cancelBudgetReminders((identifier) => identifier.startsWith(prefix)).catch(warn);
    };
  }, [identityKey]);
}
