import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

interface HomeLeaderRowProps {
  readonly label: string;
  readonly value: string;
}

const LEADER = "·".repeat(48);

/** Receipt line: label, a dotted leader that fills the gap, then the value. */
export function HomeLeaderRow({ label, value }: HomeLeaderRowProps) {
  return (
    <View accessible accessibilityLabel={`${label.toLowerCase()} ${value}`} style={styles.row}>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.text}>
        {label}
      </NativeText>
      <NativeText
        ellipsizeMode="clip"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[styles.text, styles.leader]}
      >
        {LEADER}
      </NativeText>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.text}>
        {value}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  text: { color: colors.receipt.leader, fontFamily: fonts.mono, fontSize: 13, lineHeight: 17 },
  leader: { flex: 1 },
});
