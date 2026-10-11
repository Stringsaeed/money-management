import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { TilePanel } from "@/ui/tiled-garden/tile-panel";

/** Home entry point to the Budget tab. */
export function HomeBudgetCard() {
  return (
    <View style={styles.section}>
      <Text variant="title" style={styles.title}>
        Budget
      </Text>
      <TilePanel style={styles.card}>
        <Icon name="wallet" size={26} color={colors.foreground} />
        <Text style={styles.cardTitle}>Plan your month</Text>
        <Text style={styles.copy}>See what is safe to spend until your next payday.</Text>
        <Button title="Open budget" onPress={() => router.navigate("/(tabs)/envelopes")} />
      </TilePanel>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  title: { fontFamily: typography.fontBodyBold, fontSize: typography.textLg },
  card: { gap: spacing[2] },
  cardTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.textLg,
    color: colors.foreground,
  },
  copy: { fontSize: typography.textSm, color: colors.foreground },
});
