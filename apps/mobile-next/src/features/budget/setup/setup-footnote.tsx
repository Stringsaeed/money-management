import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, fonts } from "@/ui/trove";

interface SetupFootnoteProps {
  /** Leading design emoji, e.g. 🧾, 🔔 or 👥. */
  readonly emoji: string;
  readonly text: string;
  /** md 14/20 with a 10pt gap (review) · sm 13/18 with an 8pt gap (household roles). */
  readonly size?: "md" | "sm";
}

/** A quiet explanatory sentence led by an emoji. */
export function SetupFootnote({ emoji, text, size = "md" }: SetupFootnoteProps) {
  const textStyle = size === "md" ? styles.md : styles.sm;
  return (
    <View
      accessibilityLabel={text}
      accessible
      style={[styles.row, size === "md" ? styles.gapMd : styles.gapSm]}
    >
      <NativeText importantForAccessibility="no" style={textStyle}>
        {emoji}
      </NativeText>
      <NativeText style={[styles.text, textStyle]}>{text}</NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  gapMd: { gap: 10 },
  gapSm: { gap: 8 },
  text: { color: colors.text.secondary, flex: 1, fontFamily: fonts.regular },
  md: { fontSize: 14, lineHeight: 20 },
  sm: { fontSize: 13, lineHeight: 18 },
});
