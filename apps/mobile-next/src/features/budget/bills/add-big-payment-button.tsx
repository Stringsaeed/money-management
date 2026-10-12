import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Icon, PressableScale, radius } from "@/ui/trove";

/**
 * B1's dashed "Add a big payment" action under the rows. Not `SelectChip` add: this one is a
 * full-width 48pt pill with a 15pt Nunito 800 label.
 */
export function AddBigPaymentButton({ onPress }: { readonly onPress: () => void }) {
  return (
    <PressableScale
      accessibilityLabel="Add a big payment"
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.button}
    >
      <Icon color={colors.text.secondary} name="add" size={16} strokeWidth={2.25} />
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.label}>
        Add a big payment
      </NativeText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // Dashed renders on iOS only when every side is dashed.
  button: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderStyle: "dashed",
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    marginTop: 14,
  },
  pressed: { backgroundColor: colors.fill.neutral },
  label: {
    color: colors.text.secondary,
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
  },
});
