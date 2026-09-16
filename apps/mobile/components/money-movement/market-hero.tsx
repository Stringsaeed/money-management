import { StyleSheet, View } from "react-native";

import { MarketSourceBadge } from "@/components/money-movement/market-source-badge";
import { RefreshMarketButton } from "@/components/money-movement/refresh-market-button";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface MarketHeroProps {
  hasApiKey: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

export function MarketHero({ hasApiKey, isFetching, onRefresh }: MarketHeroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          Live board for top US stocks by market cap, gold, silver, and top crypto pairs.
        </Text>
      </View>
      <View style={styles.actionsRow}>
        <MarketSourceBadge />
        <RefreshMarketButton disabled={!hasApiKey || isFetching} onPress={onRefresh} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[5],
    gap: spacing[5],
  },
  descriptionContainer: {
    gap: spacing[3],
  },
  description: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    lineHeight: 28,
    color: colors.ink,
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
