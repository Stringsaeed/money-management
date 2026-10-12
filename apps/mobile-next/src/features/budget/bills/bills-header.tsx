import { router } from "expo-router";
import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, fonts, RoundButton } from "@/ui/trove";

/** B1 header: the 44pt ringed back disc and the screen title beside it. */
export function BillsHeader() {
  return (
    <View style={styles.row}>
      <RoundButton accessibilityLabel="Back to budget" icon="back" onPress={() => router.back()} />
      <NativeText accessibilityRole="header" style={styles.title}>
        Bills & big payments
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 12 },
  title: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
});
