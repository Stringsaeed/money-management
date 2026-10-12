import { StyleSheet, View } from "react-native";

import type { V2LedgerScope } from "@trove/api/v2/contracts";

import type { HouseholdDetail } from "@/features/household/household-client";
import { LedgerOption, radius, Skeleton } from "@/ui/trove";

import { householdSub } from "./scope-sheet-copy";

interface ScopeOptionsProps {
  readonly scope: V2LedgerScope;
  readonly household: HouseholdDetail | null;
  readonly loading: boolean;
  /** Everyone else in the household, by first name. */
  readonly others: readonly string[];
  /** Safe to spend of the ledger on screen, preformatted; null hides the figure. */
  readonly activeSafe: string | null;
  readonly onSelect: (scope: V2LedgerScope) => void;
}

/** One option's SAFE column: the figure for the ledger on screen, nothing for the other. */
function safeProps(name: string, sub: string, safe: string | null) {
  return safe === null
    ? { safeLabel: "", safeValue: "", accessibilityLabel: `${name}, ${sub}` }
    : { safeValue: safe, accessibilityLabel: `${name}, ${sub}, safe to spend ${safe}` };
}

/** H1 radio group: Personal, and the household once it has loaded (a placeholder while it loads). */
export function ScopeOptions({
  scope,
  household,
  loading,
  others,
  activeSafe,
  onSelect,
}: ScopeOptionsProps) {
  const personalSub = "Just you · your own accounts";
  const personal = scope.kind === "personal";
  const householdName = household?.name ?? "Household";
  const sharedSub = householdSub(others);
  return (
    <View accessibilityLabel="Which ledger?" accessibilityRole="radiogroup" style={styles.group}>
      <LedgerOption
        emoji="👤"
        name="Personal"
        onPress={() => onSelect({ kind: "personal" })}
        selected={personal}
        sub={personalSub}
        {...safeProps("Personal", personalSub, personal ? activeSafe : null)}
      />
      {household ? (
        <LedgerOption
          emoji="🏠"
          name={householdName}
          onPress={() => onSelect({ kind: "household", householdId: household.householdId })}
          selected={!personal}
          sub={sharedSub}
          {...safeProps(householdName, sharedSub, personal ? null : activeSafe)}
        />
      ) : null}
      {loading ? (
        <View accessible accessibilityLabel="Loading household" accessibilityState={{ busy: true }}>
          <Skeleton borderRadius={radius.lg} height={OPTION_HEIGHT} />
        </View>
      ) : null}
    </View>
  );
}

/** A LedgerOption: 44pt disc plus 14pt padding above and below. */
const OPTION_HEIGHT = 72;

const styles = StyleSheet.create({ group: { gap: 10 } });
