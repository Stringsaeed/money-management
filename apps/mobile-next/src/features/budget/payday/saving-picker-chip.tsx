import { StyleSheet, Text as NativeText } from "react-native";

import {
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  Icon,
  layout,
  PressableScale,
  radius,
} from "@/ui/trove";

interface SavingPickerChipProps {
  /** The Saving for envelope the money goes to. */
  readonly name: string;
  /** Its emoji (user data), when it has one. */
  readonly emoji: string | null;
  readonly onPress: () => void;
  /** More than one Saving for envelope to pick from: shows the caret. */
  readonly canChange: boolean;
}

const HEIGHT = 34;
const SLOP = (layout.minTouchTarget - HEIGHT) / 2;

/** 34pt ringed chip inside the Save it card naming where the money goes, with a caret to change it. */
export function SavingPickerChip({ name, emoji, onPress, canChange }: SavingPickerChipProps) {
  return (
    <PressableScale
      accessibilityHint={canChange ? "Choose the Saving for envelope" : undefined}
      accessibilityLabel={`Save into ${name}`}
      accessibilityRole="button"
      hitSlop={{ bottom: SLOP, left: 0, right: 0, top: SLOP }}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.chip}
    >
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.label}
      >
        {emoji ? `${emoji} ${name}` : name}
      </NativeText>
      {canChange ? (
        <Icon color={colors.text.primary} name="chevron-down" size={12} strokeWidth={2.5} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: HEIGHT,
    // The board's ring takes no space: 12pt from the outer edge.
    paddingHorizontal: 11,
  },
  pressed: { backgroundColor: colors.fill.neutral },
  label: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
  },
});
