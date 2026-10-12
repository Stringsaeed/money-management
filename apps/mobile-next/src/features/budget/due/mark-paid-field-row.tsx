import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Icon, PressableScale, space } from "@/ui/trove";

interface MarkPaidFieldRowProps {
  readonly label: string;
  readonly value: string;
  /** Amounts print in Plex Mono; names and dates in Nunito 800. */
  readonly mono?: boolean;
  readonly divider: boolean;
  readonly open: boolean;
  readonly onPress: () => void;
}

/** 50pt row of the Mark paid fields card: label, the value, and a chevron to change it. */
export function MarkPaidFieldRow({
  label,
  value,
  mono,
  divider,
  open,
  onPress,
}: MarkPaidFieldRowProps) {
  return (
    <PressableScale
      accessibilityLabel={`${label}: ${value}, change`}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      pressedStyle={styles.pressed}
      scaleOnPress={false}
      style={[styles.row, divider ? styles.divider : null]}
    >
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.label}>
        {label}
      </NativeText>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.value, mono ? styles.mono : null]}
      >
        {value}
      </NativeText>
      <Icon
        color={colors.text.tertiary}
        name={open ? "chevron-down" : "chevron-right"}
        size={14}
        strokeWidth={2}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[2] + 2,
    minHeight: 50,
    paddingHorizontal: space[4],
  },
  divider: { borderBottomColor: colors.border.subtle, borderBottomWidth: 1 },
  pressed: { backgroundColor: colors.fill.neutral },
  label: {
    color: colors.text.secondary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  value: {
    color: colors.text.primary,
    flexShrink: 1,
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
  },
  mono: { fontFamily: fonts.monoMedium },
});
