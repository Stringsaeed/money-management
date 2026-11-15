import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";

export interface ReceiptStampProps {
  /** Printed as given, e.g. "ON PLAN · 10 OF 11". */
  label: string;
  /** `sm` 11pt (default, calc receipt) or `md` 12pt (wrap-up receipt). */
  size?: "sm" | "md";
}

/** Rubber stamp on a receipt: ink border, tilted 2°, centred. */
export function ReceiptStamp({ label, size = "sm" }: ReceiptStampProps) {
  return (
    <View accessibilityLabel={label} accessibilityRole="text" accessible style={styles.stamp}>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.text, size === "md" ? styles.md : styles.sm]}
      >
        {label}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    alignSelf: "center",
    borderColor: colors.text.onPaper,
    borderRadius: 4,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ rotate: "-2deg" }],
  },
  text: { color: colors.text.onPaper, fontFamily: fonts.monoSemibold, letterSpacing: 1.5 },
  sm: { fontSize: 11, lineHeight: 16 },
  md: { fontSize: 12, lineHeight: 18 },
});
