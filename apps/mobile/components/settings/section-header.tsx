import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface SectionHeaderProps {
  readonly title: string;
  readonly variant?: "page" | "card";
}

export function SectionHeader({ title, variant = "page" }: SectionHeaderProps) {
  return (
    <View
      testID="section-header"
      style={[styles.container, variant === "card" ? styles.cardVariant : styles.pageVariant]}
    >
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.ledgerOutline,
  },
  pageVariant: {
    paddingTop: spacing[8],
    paddingBottom: spacing[3],
    marginHorizontal: spacing[5],
  },
  cardVariant: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
});
