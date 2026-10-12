import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, RoundButton, space, Text } from "@/ui/trove";

interface QuickAddHeaderProps {
  /** Whose budget this lands in, e.g. "👤 PERSONAL BUDGET". */
  readonly stamp: string;
  readonly onClose: () => void;
}

/** Stamp over the 26pt "Add spending" title, and the 44pt close disc. */
export function QuickAddHeader({ stamp, onClose }: QuickAddHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
          {stamp}
        </Text>
        <NativeText accessibilityRole="header" style={styles.title}>
          Add spending
        </NativeText>
      </View>
      <RoundButton icon="close" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: space[2] + 2 },
  titles: { flex: 1, gap: space[0.5] },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
});
