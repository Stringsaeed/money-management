/* oxlint-disable complexity -- a quote row renders provider, freshness, and price states together. */

import { format, isSameDay, isValid, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import type { MarketQuote } from "@trove/api/v2/market-contracts";

import { DeltaBadge, ListRow, space, Text } from "@/ui/trove";

export interface MarketQuoteRowProps {
  readonly quote: MarketQuote;
}

export function MarketQuoteRow({ quote }: MarketQuoteRowProps) {
  const rising = (quote.changePercent ?? 0) >= 0;
  const updateLabel = formatUpdatedAt(quote.updatedAt);
  const detail = quote.error ? ` · ${quote.error}` : updateLabel ? ` · ${updateLabel}` : "";

  return (
    <ListRow
      icon={rising ? "income" : "expense"}
      subtitle={`${quote.symbol}${detail}`}
      title={quote.name}
      trailing={
        <View style={styles.price}>
          {/* Gap: Amount takes integer minor units and cannot show sub-cent quote prices. */}
          <Text variant="amountMd">
            {quote.price === null ? "--" : formatPrice(quote.price, quote.currency)}
          </Text>
          {quote.changePercent === null ? (
            <Text tone="tertiary" variant="amountSm">
              --
            </Text>
          ) : (
            <DeltaBadge percent={quote.changePercent} />
          )}
        </View>
      }
    />
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
  price: { alignItems: "flex-end", gap: space[0.5] },
});
