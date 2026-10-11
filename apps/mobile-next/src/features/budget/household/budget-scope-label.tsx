import { StyleSheet } from "react-native";

import { useHouseholdMembership } from "@/features/household/use-household-membership";
import { useLedgerScope } from "@/navigation/ledger-scope-context";
import { colors, Icon, layout, PressableScale, space, Text } from "@/ui/trove";

/** H1: which budget this is ("Personal" or the household's name). Tapping opens the ledger switch. */
export function BudgetScopeLabel() {
  const { scope, setScopeSheetOpen } = useLedgerScope();
  const { household } = useHouseholdMembership(
    scope.kind === "household" ? scope.householdId : null,
  );
  const name = scope.kind === "household" ? (household?.name ?? "Household") : "Personal";
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Budget: ${name}. Change budget`}
      onPress={() => setScopeSheetOpen(true)}
      scaleOnPress={false}
      style={styles.label}
    >
      <Text numberOfLines={1} style={styles.name} tone="secondary" variant="labelSm">
        {name}
      </Text>
      <Icon name="chevron-right" size={14} color={colors.text.secondary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  label: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: space[1],
    minHeight: layout.minTouchTarget,
  },
  name: { flexShrink: 1 },
});
