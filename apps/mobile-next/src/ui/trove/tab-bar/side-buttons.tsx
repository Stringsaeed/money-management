import { RoundButton } from "./round-button";
import type { TabBarScope } from "./types";
import { scopeButtonLabel } from "./utils";

export interface SideButtonsProps {
  scope: TabBarScope;
  /** Renders the scope button when set. */
  onScopePress?: () => void;
  scopeExpanded?: boolean;
  scopeLabel?: string;
  /** Renders the Accounts button when set. */
  onAccounts?: () => void;
  accountsBadge: boolean;
  accountsLabel: string;
}

/** The optional round buttons between the pill and Add: scope first, then Accounts. */
export function SideButtons({
  scope,
  onScopePress,
  scopeExpanded,
  scopeLabel,
  onAccounts,
  accountsBadge,
  accountsLabel,
}: SideButtonsProps) {
  return (
    <>
      {onScopePress ? (
        <RoundButton
          expanded={scopeExpanded}
          icon={scope === "household" ? "scope-household" : "scope-personal"}
          label={scopeLabel ?? scopeButtonLabel(scope)}
          onPress={onScopePress}
          tinted={scope === "household"}
          variant="surface"
        />
      ) : null}
      {onAccounts ? (
        <RoundButton
          badge={accountsBadge}
          icon="accounts"
          label={accountsLabel}
          onPress={onAccounts}
          variant="surface"
        />
      ) : null}
    </>
  );
}
