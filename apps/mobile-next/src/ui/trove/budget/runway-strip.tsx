import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors } from "../tokens";

/** A pay-period day: spent under or over the daily amount, today, or still to come. */
export type RunwayTick = "under" | "over" | "today" | "future";

export interface RunwayStripProps {
  /** One tick per day of the pay period, in order. */
  ticks: readonly RunwayTick[];
}

/**
 * The pay period printed as day ticks: short olive under the daily amount, taller red over,
 * the full-height accent today, then stubs to come. Decorative: the parent row carries the
 * image role and the spoken summary.
 */
export function RunwayStrip({ ticks }: RunwayStripProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.strip}
    >
      {ticks.map((tick, index) => (
        // Ticks are positional days of the period; their order never changes.
        // oxlint-disable-next-line react/no-array-index-key
        <View key={index} style={TICK_STYLE[tick]} />
      ))}
    </View>
  );
}

const tick = { borderRadius: 2, flex: 1 } as const satisfies ViewStyle;

const styles = StyleSheet.create({
  strip: { alignItems: "flex-end", flex: 1, flexDirection: "row", gap: 3, height: 16 },
  under: { ...tick, backgroundColor: colors.budget.runwayUnder, height: 7 },
  over: { ...tick, backgroundColor: colors.negative.text, height: 12 },
  today: { ...tick, backgroundColor: colors.accent.fill, height: 16 },
  future: { ...tick, backgroundColor: colors.border.subtle, height: 4 },
});

const TICK_STYLE = {
  under: styles.under,
  over: styles.over,
  today: styles.today,
  future: styles.future,
} as const satisfies Record<RunwayTick, ViewStyle>;
