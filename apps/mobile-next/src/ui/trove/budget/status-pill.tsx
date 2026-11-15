import { StyleSheet, Text as NativeText, View, type TextStyle, type ViewStyle } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "../tokens";

/** `paid` done · `ready` / `track` fine · `short` needs money. */
export type StatusPillStatus = "paid" | "ready" | "short" | "track";

export interface StatusPillProps {
  status: StatusPillStatus;
  /** Spelled out so status never rests on colour alone, e.g. "Paid ✓", "Short 75". */
  label: string;
  /** Spoken instead of the label, e.g. "Short by 75 dirhams". */
  accessibilityLabel?: string;
}

/** Bill or envelope status as a tinted pill. */
export function StatusPill({ status, label, accessibilityLabel }: StatusPillProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="text"
      accessible
      style={[styles.pill, FILL[status]]}
    >
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.label, INK[status]]}
      >
        {label}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  label: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 20 },
  fillPaid: { backgroundColor: colors.fill.neutral },
  fillAccent: { backgroundColor: colors.accent.subtle },
  fillShort: { backgroundColor: colors.warning.subtle },
  inkPaid: { color: colors.text.secondary },
  inkAccent: { color: colors.accent.text },
  inkShort: { color: colors.warning.text },
});

const FILL = {
  paid: styles.fillPaid,
  ready: styles.fillAccent,
  short: styles.fillShort,
  track: styles.fillAccent,
} as const satisfies Record<StatusPillStatus, ViewStyle>;

const INK = {
  paid: styles.inkPaid,
  ready: styles.inkAccent,
  short: styles.inkShort,
  track: styles.inkAccent,
} as const satisfies Record<StatusPillStatus, TextStyle>;
