import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

/**
 * A plain sentence printed on a receipt in Nunito (paper secondary ink), under its total.
 * `ReceiptNote` is the centred mono footer; this is the explanation line.
 */
export function ReceiptSentence({ text }: { readonly text: string }) {
  return (
    <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.text}>
      {text}
    </NativeText>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.paper.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
