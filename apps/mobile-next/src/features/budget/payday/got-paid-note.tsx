import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "@/ui/trove";

/** Accent-tinted line under Got paid's fields: the month this salary starts and what comes next. */
export function GotPaidNote({ text }: { readonly text: string }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.note}>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.text}>
        {text}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    backgroundColor: colors.accent.subtle,
    borderCurve: "continuous",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: { color: colors.text.primary, fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
});
