import { useLedgerScope } from "@/modules/access";

import { LedgerScopeBadge } from "./ledger-scope-badge";
import { LedgerScopePicker } from "./ledger-scope-picker";

export function LedgerScopeChrome() {
  const scope = useLedgerScope();

  const emoji = scope.kind === "household" ? "🏠" : "👤";
  const label = scope.kind === "household" ? (scope.householdName ?? "Household") : "Personal";
  const canInteract = scope.canSwitch && scope.availableHouseholds.length > 0;

  if (scope.kind === "local_anonymous") {
    return <LedgerScopeBadge emoji="👤" label="Local" />;
  }

  if (!canInteract) {
    return <LedgerScopeBadge emoji={emoji} label={label} />;
  }

  if (scope.availableHouseholds.length === 1) {
    const toggleTarget =
      scope.kind === "personal" ? scope.availableHouseholds[0].householdId : null;

    return (
      <LedgerScopeBadge
        emoji={emoji}
        label={label}
        interactive
        onPress={() => scope.setActiveHousehold?.(toggleTarget)}
      />
    );
  }

  return (
    <LedgerScopePicker scope={scope}>
      <LedgerScopeBadge emoji={emoji} label={label} interactive />
    </LedgerScopePicker>
  );
}
