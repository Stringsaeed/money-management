import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors } from "@/ui/trove";

import type { SpendTick } from "./home-spend-ticks";

interface HomeSpendStripProps {
  readonly ticks: readonly SpendTick[];
}

/** One tick per pay-period day: green under the daily allowance, red over, ink today, then blanks. */
export function HomeSpendStrip({ ticks }: HomeSpendStripProps) {
  return (
    <View style={styles.strip}>
      {ticks.map((tick, index) => (
        // Ticks are positional days of the period; their order never changes.
        // oxlint-disable-next-line react/no-array-index-key
        <View key={index} style={[styles.tick, TICK_STYLE[tick]]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { alignItems: "flex-end", flex: 1, flexDirection: "row", gap: 2, height: 12 },
  tick: { borderRadius: 1, flex: 1 },
  under: { backgroundColor: colors.paper.accentText, height: 5 },
  over: { backgroundColor: colors.paper.negative, height: 9 },
  today: { backgroundColor: colors.paper.ink, height: 12 },
  future: { backgroundColor: colors.paper.rule, height: 3 },
});

const TICK_STYLE = {
  under: styles.under,
  over: styles.over,
  today: styles.today,
  future: styles.future,
} as const satisfies Record<SpendTick, ViewStyle>;
