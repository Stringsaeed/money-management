import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

/** Empty inbox: nothing the server refused — a good place to be. */
export function RejectedChangesEmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Nothing rejected</Text>
      <Text style={styles.body}>
        Changes the server couldn&apos;t accept will show up here with the reason, so you can fix or
        discard them.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[2],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    padding: spacing[8],
    borderCurve: "continuous",
  },
  emoji: {
    fontSize: typography.text4xl,
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    letterSpacing: typography.trackingTight,
    color: colors.ink,
  },
  body: {
    textAlign: "center",
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
});
