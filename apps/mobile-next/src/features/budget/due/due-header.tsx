import { router } from "expo-router";
import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, RoundButton, space, Text } from "@/ui/trove";

interface DueHeaderProps {
  /** Today's stamp, e.g. "SUN 11.10.26"; absent until the budget has loaded. */
  readonly stamp?: string;
}

/** The board's own header: 44pt back disc, the date stamp and a 28pt "Due". */
export function DueHeader({ stamp }: DueHeaderProps) {
  return (
    <View style={styles.row}>
      <RoundButton accessibilityLabel="Back to budget" icon="back" onPress={() => router.back()} />
      <View style={styles.titles}>
        {stamp ? (
          <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
            {stamp}
          </Text>
        ) : null}
        <NativeText accessibilityRole="header" style={styles.title}>
          Due
        </NativeText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: space[3] },
  titles: { flex: 1 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
});
