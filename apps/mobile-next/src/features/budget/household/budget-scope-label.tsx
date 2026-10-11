import { Pressable, StyleSheet } from "react-native";

import { useHouseholdMembership } from "@/features/household/use-household-membership";
import { useLedgerScope } from "@/navigation/ledger-scope-context";
import { colors, spacing } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

/** H1: which budget this is ("Personal" or the household's name). Tapping opens the ledger switch. */
export function BudgetScopeLabel() {
  const { scope, setScopeSheetOpen } = useLedgerScope();
  const { household } = useHouseholdMembership(
    scope.kind === "household" ? scope.householdId : null,
  );
  const name = scope.kind === "household" ? (household?.name ?? "Household") : "Personal";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Budget: ${name}. Change budget`}
      onPress={() => setScopeSheetOpen(true)}
      style={styles.label}
    >
      <Text variant="label" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <Icon name="caret-right" size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing[1],
    minHeight: 44,
  },
  name: { flexShrink: 1 },
});
