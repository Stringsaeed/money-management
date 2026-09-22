import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/ui/text";
import { Icon } from "@/ui/icon";
import { spacing, typography } from "@/ui/design-tokens";
import { TilePanel } from "@/ui/tiled-garden/tile-panel";
import { tileColors } from "@/ui/tiled-garden/tile-tokens";

export function HomeBudgetPreview() {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text variant="title" style={styles.title}>
          Budgets
        </Text>
        <Text style={styles.badge}>COMING SOON</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cards}
      >
        <TilePanel tone="pink" motif style={styles.card}>
          <Icon name="wallet" size={26} color={tileColors.ink} />
          <Text style={styles.cardTitle}>A little structure.</Text>
          <Text style={styles.copy}>Budgets for everyday life, with room to breathe.</Text>
          <Text style={styles.caption}>Budgets are not available yet.</Text>
        </TilePanel>
        <TilePanel tone="olive" motif style={styles.card}>
          <Icon name="chart-line-up" size={26} color={tileColors.ink} />
          <Text style={styles.cardTitle}>A bigger picture.</Text>
          <Text style={styles.copy}>See what is left for the things that matter to you.</Text>
          <Text style={styles.caption}>Coming in a future release.</Text>
        </TilePanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3], marginHorizontal: -spacing[5] },
  heading: {
    paddingHorizontal: spacing[5],
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  title: { fontFamily: typography.fontBodyBold, fontSize: typography.textLg },
  badge: {
    fontSize: 9,
    letterSpacing: 1.1,
    fontFamily: typography.fontBodyBold,
    padding: spacing[1.5],
    borderWidth: 1,
    borderColor: tileColors.grout,
    color: tileColors.ink,
    backgroundColor: tileColors.cream,
    borderRadius: 6,
  },
  cards: {
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
    paddingTop: spacing[1],
  },
  card: { width: 258, gap: spacing[2] },
  cardTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.textLg,
    color: tileColors.ink,
  },
  copy: { fontSize: typography.textSm, color: tileColors.ink },
  caption: { fontSize: typography.textXs, color: tileColors.ink, opacity: 0.7 },
});
