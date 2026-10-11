import { StyleSheet, Text as NativeText, View } from "react-native";

import {
  amountAccessibilityLabel,
  colors,
  dateChipParts,
  DENSE_MAX_FONT_SCALE,
  fonts,
  layout,
  PressableScale,
  space,
  Text,
} from "@/ui/trove";

import { HomeDateChip } from "./home-date-chip";
import { plainAmount } from "./home-money";
import type { HomeUpcomingItem } from "./home-upcoming-model";

interface HomeUpcomingRowProps {
  readonly item: HomeUpcomingItem;
  readonly currency: string;
  readonly onPress: (ruleId: string) => void;
}

/** 64pt row: calendar chip, emoji and title over a mono caption, and the signed figure. */
export function HomeUpcomingRow({ item, currency, onPress }: HomeUpcomingRowProps) {
  const money = item.kind === "income";
  const label = [
    item.title,
    `${item.next ? "next due" : "due"} ${dateChipParts(item.date).spoken}`,
    item.meta.toLowerCase(),
    `${money ? "plus " : ""}${amountAccessibilityLabel(item.minor, currency)}`,
  ].join(", ");
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => onPress(item.ruleId)}
      scaleOnPress={false}
      pressedStyle={styles.pressed}
      style={styles.row}
    >
      <HomeDateChip date={item.date} next={item.next} />
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
          {item.emoji ? `${item.emoji} ` : ""}
          {item.title}
        </Text>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={[styles.meta, item.short ? styles.metaShort : null]}
        >
          {item.meta}
        </NativeText>
      </View>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.amount, money ? styles.amountIn : null]}
      >
        {plainAmount(item.minor, currency, item.kind === "transfer" ? "never" : "always")}
      </NativeText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[3],
    minHeight: layout.listRowMinHeight,
  },
  pressed: { opacity: 0.7 },
  copy: { flex: 1, minWidth: 0 },
  meta: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 16 },
  metaShort: { color: colors.warning.text },
  amount: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  amountIn: { color: colors.positive.text },
});
