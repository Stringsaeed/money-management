import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

interface SectionStampProps {
  /** Printed in caps, e.g. "MONEY YOU HAVE RIGHT NOW". */
  readonly label: string;
  /** Right of the stamp: a mono group total ("4,675") or a Nunito note ("For reference only"). */
  readonly trailing?: string;
  readonly trailingStyle?: "mono" | "note";
}

/** Mono section heading of the setup boards, with an optional figure or note on the right. */
export function SectionStamp({ label, trailing, trailingStyle = "mono" }: SectionStampProps) {
  const stamp = (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
      tone="tertiary"
      variant="stamp"
    >
      {label}
    </Text>
  );
  if (trailing === undefined) return stamp;
  return (
    <View style={styles.row}>
      {stamp}
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={trailingStyle === "mono" ? styles.mono : styles.note}
      >
        {trailing}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between" },
  mono: {
    color: colors.text.tertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 11,
    lineHeight: 14,
  },
  note: { color: colors.text.tertiary, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
});
