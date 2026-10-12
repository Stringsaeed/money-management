import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Icon, PressableScale, radius } from "@/ui/trove";

export interface GotPaidField {
  readonly key: string;
  /** e.g. "Into", "Date". */
  readonly label: string;
  /** e.g. "ENBD Current", "Today, 25 Oct". */
  readonly value: string;
  readonly onPress: () => void;
}

/** Got paid's ringed card of tappable fields: label, value, chevron; 50pt rows split by a hairline. */
export function GotPaidFields({ fields }: { readonly fields: readonly GotPaidField[] }) {
  return (
    <View style={styles.card}>
      {fields.map((field, index) => (
        <PressableScale
          accessibilityHint="Opens a list to change it"
          accessibilityLabel={`${field.label}: ${field.value}, change`}
          accessibilityRole="button"
          key={field.key}
          onPress={field.onPress}
          pressedStyle={styles.pressed}
          scaleOnPress={false}
          style={[styles.row, index < fields.length - 1 ? styles.divider : null]}
        >
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.label}>
            {field.label}
          </NativeText>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            numberOfLines={1}
            style={styles.value}
          >
            {field.value}
          </NativeText>
          <Icon color={colors.text.tertiary} name="chevron-right" size={14} strokeWidth={2} />
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 50,
    // The board's ring takes no space; 16pt from the card's outer edge.
    paddingHorizontal: 15,
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
});
