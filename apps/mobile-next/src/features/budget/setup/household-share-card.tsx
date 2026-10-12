import { StyleSheet, View } from "react-native";

import { colors, fonts, radius, space, Text } from "@/ui/trove";

/**
 * H2's Household share card. The share becomes a Bill in the Personal budget once this budget
 * has started (the household home offers it), so here it explains rather than switches.
 */
export function HouseholdShareCard() {
  return (
    <View accessible style={styles.card}>
      <Text style={styles.title} variant="labelMd">
        “Household share” in your Personal budget
      </Text>
      <Text tone="secondary" variant="bodySm">
        After you start, you can add your share as a Bill in your own budget. Your Personal budget
        stays separate.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space[0.5],
    paddingHorizontal: space[4] - 1,
    paddingVertical: 13,
  },
  title: { fontFamily: fonts.extrabold },
});
