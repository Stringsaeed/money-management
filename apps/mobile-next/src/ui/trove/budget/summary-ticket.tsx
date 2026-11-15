import { StyleSheet, Text as NativeText, View, type StyleProp, type ViewStyle } from "react-native";

import { RECEIPT_PADDING } from "../receipt/receipt-padding";
import { ReceiptSlip } from "../receipt/receipt-slip";
import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";

export interface SummaryTicketProps {
  /** Caps caption, e.g. "BILLS". */
  label: string;
  /** Printed top right, e.g. 🧾. */
  emoji: string;
  /** The headline, e.g. "2 of 4 paid". */
  value: string;
  /** e.g. "next · Car loan today". */
  sub: string;
  onPress: () => void;
  /** e.g. "Bills: 2 of 4 paid, next · Car loan today". */
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** Outer layout, e.g. `flex: 1` for two tickets side by side. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Torn mini receipt linking to a budget section (bills, saving for) from Budget home. */
export function SummaryTicket({
  label,
  emoji,
  value,
  sub,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: SummaryTicketProps) {
  return (
    <ReceiptSlip
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      gap={4}
      onPress={onPress}
      padding={RECEIPT_PADDING.ticket}
      radius={10}
      style={style}
      tearDepth={8}
      testID={testID}
    >
      <View style={styles.top}>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.label}
        >
          {label}
        </NativeText>
        <NativeText allowFontScaling={false} style={styles.emoji}>
          {emoji}
        </NativeText>
      </View>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={styles.value}
      >
        {value}
      </NativeText>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} style={styles.sub}>
        {sub}
      </NativeText>
    </ReceiptSlip>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", gap: 6, justifyContent: "space-between" },
  label: {
    color: colors.paper.textTertiary,
    flexShrink: 1,
    fontFamily: fonts.monoSemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 12,
  },
  // The board sets the 13pt emoji on the caption's 12pt line; a taller line with negative
  // margins keeps that 12pt row without clipping the glyph on Android.
  emoji: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, marginVertical: -2 },
  value: {
    color: colors.text.onPaper,
    fontFamily: fonts.monoSemibold,
    fontSize: 17,
    lineHeight: 22,
  },
  sub: { color: colors.paper.textSecondary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 14 },
});
