import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius, Text } from "@/ui/trove";

interface ActivityRowProps {
  /** The mover's initial, e.g. "S". */
  readonly initial: string;
  /** e.g. "Sara moved AED 100 from Dining to Groceries". */
  readonly sentence: string;
  /** Mono caption, e.g. "2h ago". */
  readonly ago: string;
}

/** One household money move, laid out like Budget home's envelope rows. */
export function ActivityRow({ initial, sentence, ago }: ActivityRowProps) {
  return (
    <View accessibilityLabel={`${sentence}, ${ago}`} accessible style={styles.row}>
      <View style={styles.disc}>
        <NativeText allowFontScaling={false} style={styles.initial}>
          {initial}
        </NativeText>
      </View>
      <View style={styles.texts}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} variant="labelMd">
          {sentence}
        </Text>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.ago}>
          {ago}
        </NativeText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingTop: 10,
  },
  disc: {
    alignItems: "center",
    backgroundColor: colors.accent.fill,
    borderRadius: radius.full,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  initial: { color: colors.accent.on, fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 22 },
  texts: { flex: 1, minWidth: 0 },
  ago: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 15 },
});
