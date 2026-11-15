import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { colors, radius, SafeToSpendSkeleton, Skeleton } from "@/ui/trove";

import { BudgetHeader } from "./budget-header";
import { SectionHeader } from "./section-header";
import { SummaryTickets } from "./summary-tickets";

const LOADING_TICKET = { value: "···", sub: " " } as const;
const PLACEHOLDER_ROWS = ["first", "second", "third"] as const;

interface BudgetHomeLoadingProps {
  /** Today's stamp, e.g. "SUN 11.10.26". */
  readonly stamp: string;
}

/** Budget home while the budget loads: the page's shape with placeholders, never a number. */
export function BudgetHomeLoading({ stamp }: BudgetHomeLoadingProps) {
  return (
    <View style={styles.column}>
      <BudgetHeader bell={{ count: 0, onPress: () => router.push("/budget/due") }} stamp={stamp} />
      <SafeToSpendSkeleton />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.section}
      >
        <SectionHeader title="EVERYDAY" />
        {PLACEHOLDER_ROWS.map((key) => (
          <View key={key} style={styles.row}>
            <Skeleton borderRadius={radius.full} height={34} width={34} />
            <View style={styles.lines}>
              <Skeleton borderRadius={6} height={14} width="55%" />
              <Skeleton borderRadius={6} height={10} width="35%" />
            </View>
          </View>
        ))}
      </View>
      <SummaryTickets bills={LOADING_TICKET} saving={LOADING_TICKET} savingEmoji="🏠" />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 18 },
  section: { gap: 2 },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingTop: 10,
  },
  lines: { flex: 1, gap: 6 },
});
