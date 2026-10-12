import { StyleSheet, View } from "react-native";

import { DENSE_MAX_FONT_SCALE, DueBell, Text } from "@/ui/trove";

import { dueBellLabel } from "./due-bell-model";

interface BudgetHeaderProps {
  /** Mono stamp over the title, e.g. "SUN 11.10.26 · PAYDAY" or "NO BUDGET YET". */
  readonly stamp: string;
  /** The Due bell; the intro has none. */
  readonly bell?: { readonly count: number; readonly onPress: () => void };
}

/** The Budget tab's title block: date stamp over "Budget", and the Due bell on the right. */
export function BudgetHeader({ stamp, bell }: BudgetHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          tone="tertiary"
          variant="stamp"
        >
          {stamp}
        </Text>
        <Text accessibilityRole="header" numberOfLines={1} variant="display">
          Budget
        </Text>
      </View>
      {bell ? (
        <DueBell
          accessibilityHint="Opens what is due"
          accessibilityLabel={dueBellLabel(bell.count)}
          count={bell.count}
          onPress={bell.onPress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  titles: { flexShrink: 1, gap: 4 },
});
