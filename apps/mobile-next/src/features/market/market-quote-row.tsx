/* oxlint-disable complexity -- a quote row renders provider, freshness, and price states together. */

import { format, isSameDay, isValid, parseISO } from "date-fns";
import { useColorScheme, StyleSheet, View } from "react-native";

import type { MarketQuote } from "@trove/api/v2/market-contracts";

import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, rawColorValues, spacing, typography } from "@/ui/design-tokens";

export interface MarketQuoteRowProps {
  readonly quote: MarketQuote;
}

export function MarketQuoteRow({ quote }: MarketQuoteRowProps) {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? rawColorValues.dark : rawColorValues.light;
  const positive = (quote.changePercent ?? 0) >= 0;
  const updateLabel = formatUpdatedAt(quote.updatedAt);

  return (
    <View style={styles.quote}>
      <View style={styles.quoteIcon}>
        <Icon
          name={positive ? "trend-up" : "trend-down"}
          size={18}
          color={positive ? palette.sage : palette.terracotta}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{quote.name}</Text>
        <Text style={styles.symbol}>
          {quote.symbol}
          {quote.error ? ` · ${quote.error}` : updateLabel ? ` · ${updateLabel}` : ""}
        </Text>
      </View>
      <View style={styles.price}>
        <Text style={styles.priceText}>
          {quote.price === null ? "--" : formatPrice(quote.price, quote.currency)}
        </Text>
        <Text style={[styles.change, { color: positive ? palette.sage : palette.terracotta }]}>
          {quote.changePercent === null
            ? "--"
            : `${positive ? "+" : ""}${quote.changePercent.toFixed(2)}%`}
        </Text>
      </View>
    </View>
  );
}

function formatUpdatedAt(updatedAt: string | null): string | null {
  if (!updatedAt) return null;
  const parsed = parseISO(updatedAt);
  if (!isValid(parsed)) return null;
  return isSameDay(parsed, new Date())
    ? `Updated ${format(parsed, "HH:mm")}`
    : `Updated ${format(parsed, "MMM d, HH:mm")}`;
}

function formatPrice(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 2 : 4,
  }).format(value);
}

const styles = StyleSheet.create({
  quote: { alignItems: "center", flexDirection: "row", gap: spacing[3], minHeight: 64 },
  quoteIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: { flex: 1, gap: spacing[0.5] },
  name: { color: colors.ink, fontFamily: typography.fontBodySemibold },
  symbol: { color: colors.mutedForeground, fontSize: typography.textXs },
  price: { alignItems: "flex-end", gap: spacing[0.5] },
  priceText: {
    color: colors.ink,
    fontFamily: typography.fontBodySemibold,
    fontVariant: ["tabular-nums"],
  },
  change: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    fontVariant: ["tabular-nums"],
  },
});
