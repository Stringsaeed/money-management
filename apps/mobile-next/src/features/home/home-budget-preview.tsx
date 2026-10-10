import { ScrollView, StyleSheet, View } from "react-native";

import { Card, Icon, layout, SoonBadge, space, Text, type IconName } from "@/ui/trove";

const TEASERS = [
  {
    icon: "accounts",
    title: "A little structure.",
    copy: "Budgets for everyday life, with room to breathe.",
    caption: "Budgets are not available yet.",
  },
  {
    icon: "insights",
    title: "A bigger picture.",
    copy: "See what is left for the things that matter to you.",
    caption: "Coming in a future release.",
  },
] as const satisfies readonly {
  icon: IconName;
  title: string;
  copy: string;
  caption: string;
}[];

export function HomeBudgetPreview() {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text variant="titleSm">Budgets</Text>
        <SoonBadge />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cards}
      >
        {TEASERS.map((teaser) => (
          <Card key={teaser.title} style={styles.card}>
            <Icon name={teaser.icon} size={24} />
            <Text variant="titleSm">{teaser.title}</Text>
            <Text variant="bodySm">{teaser.copy}</Text>
            <Text tone="tertiary" variant="bodySm">
              {teaser.caption}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3], marginHorizontal: -layout.screenGutter },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
    justifyContent: "space-between",
    paddingHorizontal: layout.screenGutter,
  },
  cards: {
    gap: space[3],
    paddingBottom: space[2],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[1],
  },
  card: { gap: space[2], width: 258 },
});
