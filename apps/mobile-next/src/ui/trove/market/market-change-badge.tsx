import { StyleSheet, View } from "react-native";

import { Text, type TextTone } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts, radius, space } from "../tokens";
import { changeTone, marketChangeLabel, type ChangeTone } from "./utils";

export interface MarketChangeBadgeProps {
  /** 24h change in percent (2.4 = +2.4%). */
  percent: number;
}

const TEXT_TONE = {
  positive: "positive",
  negative: "negative",
  neutral: "secondary",
} as const satisfies Record<ChangeTone, TextTone>;

/** "▲ 2.4%" / "▼ 1.1%" pill. Decorative: the row speaks the change in words. */
export function MarketChangeBadge({ percent }: MarketChangeBadgeProps) {
  const tone = changeTone(percent);
  return (
    <View style={[styles.pill, pillTone[tone]]}>
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.label}
        tone={TEXT_TONE[tone]}
        variant="amountSm"
      >
        {marketChangeLabel(percent)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-end",
    borderRadius: radius.full,
    paddingHorizontal: space[2] - 1,
    paddingVertical: 1,
  },
  label: { fontFamily: fonts.monoSemibold, fontSize: 11, lineHeight: 16 },
});

const pillTone = StyleSheet.create({
  positive: { backgroundColor: colors.positive.subtle },
  negative: { backgroundColor: colors.negative.subtle },
  neutral: { backgroundColor: colors.fill.neutral },
});
