import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Icon, PressableScale } from "@/ui/trove";

/** "Adjust amounts instead ›": a 44pt full-width text link under the repeat card. */
export function AdjustLink({ onPress }: { readonly onPress: () => void }) {
  return (
    <PressableScale
      accessibilityHint="Shows every envelope's amount to change"
      accessibilityLabel="Adjust amounts instead"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.link}
    >
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.label}>
        Adjust amounts instead
      </NativeText>
      <Icon color={colors.text.primary} name="chevron-right" size={16} strokeWidth={2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  link: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
  },
  label: { color: colors.text.primary, fontFamily: fonts.extrabold, fontSize: 15, lineHeight: 20 },
});
