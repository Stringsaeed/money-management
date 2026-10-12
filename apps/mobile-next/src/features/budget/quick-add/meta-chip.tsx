import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, PressableScale, radius } from "@/ui/trove";

interface MetaChipProps {
  /** Design copy or user data, e.g. 💵 for a cash account, 📅 for the date. */
  readonly emoji: string;
  readonly label: string;
  /** Spoken name with its value, e.g. "Paid with: Cash". */
  readonly accessibilityLabel: string;
  /** Its editor is open below. */
  readonly active: boolean;
  /** Takes the row's leftover width (the note), truncating its label. */
  readonly grow?: boolean;
  readonly onPress: () => void;
}

/** Lifts the 36pt chip to the 44pt touch target. */
const HIT_SLOP = { top: 4, bottom: 4 } as const;

/** 36pt ringed detail chip under Quick add's envelopes: paid with, date, category, note. */
export function MetaChip({
  emoji,
  label,
  accessibilityLabel,
  active,
  grow,
  onPress,
}: MetaChipProps) {
  return (
    <View style={grow ? styles.grow : styles.shrink}>
      <PressableScale
        accessibilityHint="Changes it"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ expanded: active }}
        hitSlop={HIT_SLOP}
        onPress={onPress}
        pressedStyle={styles.pressed}
        style={[styles.chip, active ? styles.active : null]}
      >
        <NativeText
          accessibilityElementsHidden
          importantForAccessibility="no"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.label}
        >
          {emoji}
        </NativeText>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={[styles.label, styles.text]}
        >
          {label}
        </NativeText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 36,
    minWidth: 0,
    // Board: 12pt from the outer edge; the native ring takes 1pt of it.
    paddingHorizontal: 11,
  },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1, minWidth: 0 },
  active: { backgroundColor: colors.fill.neutral },
  pressed: { backgroundColor: colors.fill.neutral },
  label: { color: colors.text.secondary, fontFamily: fonts.bold, fontSize: 13, lineHeight: 18 },
  text: { flexShrink: 1 },
});
