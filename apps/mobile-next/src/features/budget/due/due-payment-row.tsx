import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Icon, PressableScale, space } from "@/ui/trove";

export interface DuePaymentField {
  /** Printed in caps: AMOUNT, FROM, DATE. */
  readonly label: string;
  readonly value: string;
}

interface DuePaymentRowProps {
  readonly field: DuePaymentField;
  /** Opens Mark paid to change it; absent for a read-only viewer. */
  readonly onPress?: () => void;
}

/** One k/v line printed on the paper block of a bill due now, with a chevron to change it. */
export function DuePaymentRow({ field, onPress }: DuePaymentRowProps) {
  return (
    <PressableScale
      accessibilityLabel={`${field.label}: ${field.value}${onPress ? ", change" : ""}`}
      accessibilityRole={onPress ? "button" : "text"}
      disabled={!onPress}
      onPress={onPress}
      pressedStyle={styles.pressed}
      scaleOnPress={false}
      style={styles.row}
    >
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={[styles.text, styles.label]}>
        {field.label.toUpperCase()}
      </NativeText>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.text, styles.value]}
      >
        {field.value}
      </NativeText>
      {onPress ? (
        <Icon color={colors.paper.textTertiary} name="chevron-right" size={14} strokeWidth={2} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: space[2], minHeight: 38 },
  pressed: { opacity: 0.6 },
  text: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 },
  label: { color: colors.paper.textTertiary, letterSpacing: 0.8, width: 74 },
  value: { color: colors.text.onPaper, flex: 1, fontFamily: fonts.monoMedium },
});
