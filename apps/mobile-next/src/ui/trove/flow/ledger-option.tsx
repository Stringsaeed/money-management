import { StyleSheet, Text as NativeText, View } from "react-native";

import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts, radius, space } from "../tokens";

export interface LedgerOptionProps {
  /** 👤 Personal · 🏠 Household. */
  emoji: string;
  name: string;
  /** e.g. "Just you · your own accounts". */
  sub: string;
  /** Mono caption over the figure. */
  safeLabel?: string;
  /** Preformatted safe-to-spend figure, e.g. "1,988". Omit to drop the SAFE column. */
  safeValue?: string;
  selected: boolean;
  onPress: () => void;
  /** Defaults to "{name}, {sub}, {safeLabel} {safeValue}", or "{name}, {sub}" without a figure. */
  accessibilityLabel?: string;
  testID?: string;
}

const PADDING_X = space[4];
const PADDING_Y = 14;

/** Ledger switch choice (screen board sizes): emoji disc, name and sub, and its safe-to-spend. */
export function LedgerOption({
  emoji,
  name,
  sub,
  safeLabel = "SAFE",
  safeValue,
  selected,
  onPress,
  accessibilityLabel,
  testID,
}: LedgerOptionProps) {
  return (
    <PressableScale
      accessibilityLabel={
        accessibilityLabel ??
        (safeValue === undefined ? `${name}, ${sub}` : `${name}, ${sub}, ${safeLabel} ${safeValue}`)
      }
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      pressedStyle={selected ? null : styles.pressed}
      style={[styles.card, selected ? styles.selected : styles.idle]}
      testID={testID}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.disc}
      >
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.emoji}>
          {emoji}
        </NativeText>
      </View>
      <View style={styles.texts}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="titleSm">
          {name}
        </Text>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="secondary" variant="bodySm">
          {sub}
        </Text>
      </View>
      {safeValue === undefined ? null : (
        <View style={styles.safe}>
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.safeLabel}>
            {safeLabel}
          </NativeText>
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.safeValue}>
            {safeValue}
          </NativeText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: space[3],
  },
  // Board rings are inset box-shadows; the padding gives a native border's width back.
  idle: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderWidth: 1,
    paddingHorizontal: PADDING_X - 1,
    paddingVertical: PADDING_Y - 1,
  },
  selected: {
    backgroundColor: colors.accent.subtle,
    borderColor: colors.accent.fill,
    borderWidth: 1.5,
    paddingHorizontal: PADDING_X - 1.5,
    paddingVertical: PADDING_Y - 1.5,
  },
  pressed: { backgroundColor: colors.fill.neutral },
  disc: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  emoji: { fontSize: 22, lineHeight: 28 },
  texts: { flex: 1, minWidth: 0 },
  safe: { alignItems: "flex-end" },
  safeLabel: {
    color: colors.text.tertiary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 13,
  },
  safeValue: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 16,
    lineHeight: 21,
  },
});
