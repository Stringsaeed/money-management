import type { V2RecurringRule } from "@trove/api/v2/contracts";
import { ledgerClient, type LedgerScope } from "./ledger-client";

export async function changeRecurringLifecycle(
  scope: LedgerScope,
  id: string,
  observed: V2RecurringRule["lifecycle"],
  requested: "active" | "paused" | "archived",
) {
  const latest = await ledgerClient.recurring.get(scope, id);
  if (latest.lifecycle === requested) return latest;
  if (latest.lifecycle !== observed) {
    throw new Error("This recurring transaction changed. Review its current state and try again.");
  }
  // Settlement changes the revision without changing this user intent. Patch
  // only lifecycle against the fresh revision; never overwrite financial fields.
  return ledgerClient.recurring.update(
    scope,
    id,
    { lifecycle: requested },
    { version: latest.revision },
  );
}
