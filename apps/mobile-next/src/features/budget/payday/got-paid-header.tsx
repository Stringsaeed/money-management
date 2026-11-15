import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

/** Got paid's mono kicker ("PAYDAY · SUN 25 OCT") over its Nunito 800 26/32 question. */
export function GotPaidHeader({ kicker }: { readonly kicker: string }) {
  return (
    <View style={styles.header}>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
        {kicker}
      </Text>
      <NativeText accessibilityRole="header" style={styles.title}>
        Did your salary land?
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
});
