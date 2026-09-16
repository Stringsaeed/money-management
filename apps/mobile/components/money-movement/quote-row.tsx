import { TrendDownIcon, TrendUpIcon } from "phosphor-react-native";
import { StyleSheet, View } from "react-native";

import { formatPrice, formatSignedPercent } from "@/components/money-movement/market-formatters";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { MarketQuote } from "@/hooks/use-market-quotes";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface QuoteRowProps {
  quote: MarketQuote;
  isLast: boolean;
}

export function QuoteRow({ quote, isLast }: QuoteRowProps) {
  const isPositive = (quote.percentChange ?? 0) >= 0;
  const statusText = quote.errorMessage ?? quote.updatedAt ?? "latest quote";

  return (
    <View style={[styles.container, !isLast && styles.containerWithBorder]}>
      <Text style={styles.emoji}>{quote.emoji}</Text>
      <View style={styles.labelContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{quote.label}</Text>
          <Text style={styles.symbol}>{quote.symbol}</Text>
        </View>
        <Text style={styles.exchange}>
          {quote.exchange ?? "Global"} · {statusText}
        </Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price} selectable>
          {formatPrice(quote.price, quote.currency)}
        </Text>
        <View style={styles.changeRow}>
          <Icon
            as={isPositive ? TrendUpIcon : TrendDownIcon}
            style={isPositive ? styles.iconPositive : styles.iconNegative}
            size={14}
          />
          <Text
            style={[styles.percent, isPositive ? styles.percentPositive : styles.percentNegative]}
          >
            {formatSignedPercent(quote.percentChange)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  containerWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ledgerOutline,
  },
  emoji: {
    width: 32,
    textAlign: "center",
    fontSize: typography.textXl,
  },
  labelContainer: {
    flex: 1,
    gap: spacing[0.5],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  label: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  symbol: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  exchange: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  priceContainer: {
    alignItems: "flex-end",
    gap: spacing[1],
  },
  price: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  iconPositive: {
    color: colors.sage,
  },
  iconNegative: {
    color: colors.terracotta,
  },
  percent: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    fontVariant: ["tabular-nums"],
  },
  percentPositive: {
    color: colors.sage,
  },
  percentNegative: {
    color: colors.terracotta,
  },
});
