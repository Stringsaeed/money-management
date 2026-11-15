import { StyleSheet, Text as NativeText, View, type ViewStyle } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";
import type { RunwayTick } from "./runway-strip";

export interface RunwayLegendProps {
  /** Override the default English labels: Under, Over, Today, To come. */
  labels?: Readonly<Record<RunwayTick, string>>;
}

const DEFAULT_LABELS = {
  under: "Under",
  over: "Over",
  today: "Today",
  future: "To come",
} as const satisfies Record<RunwayTick, string>;

const ORDER = ["under", "over", "today", "future"] as const satisfies readonly RunwayTick[];

/** Key for the runway strip: a swatch at each tick's height beside its name, four across. */
export function RunwayLegend({ labels = DEFAULT_LABELS }: RunwayLegendProps) {
  return (
    <View style={styles.grid}>
      {ORDER.map((tick) => (
        <View key={tick} style={styles.item}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={SWATCH_STYLE[tick]}
          />
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={styles.label}
          >
            {labels[tick]}
          </NativeText>
        </View>
      ))}
    </View>
  );
}

const swatch = { borderRadius: 2, width: 6 } as const satisfies ViewStyle;

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 8 },
  item: { alignItems: "flex-end", flex: 1, flexDirection: "row", gap: 6, minWidth: 0 },
  label: {
    color: colors.text.secondary,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 14,
  },
  under: { ...swatch, backgroundColor: colors.budget.runwayUnder, height: 7 },
  over: { ...swatch, backgroundColor: colors.negative.text, height: 12 },
  today: { ...swatch, backgroundColor: colors.accent.fill, height: 16 },
  // The legend rings "to come" in border.default so the stub reads against the canvas.
  future: { ...swatch, backgroundColor: colors.border.default, height: 4 },
});

const SWATCH_STYLE = {
  under: styles.under,
  over: styles.over,
  today: styles.today,
  future: styles.future,
} as const satisfies Record<RunwayTick, ViewStyle>;
