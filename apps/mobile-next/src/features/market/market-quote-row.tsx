import { format, isSameDay, isValid, parseISO } from "date-fns";
import { StyleSheet, View } from "react-native";

import type { MarketQuote } from "@trove/api/v2/market-contracts";

import { Amount, DeltaBadge, ListRow, MarketRow, space, Text } from "@/ui/trove";

import { decimalPrice } from "./market-price";

export interface MarketQuoteRowProps {
  readonly quote: MarketQuote;
}

/** The quote API has no price history yet, so the sparkline stays empty rather than inventing one. */
const NO_SPARKLINE: readonly number[] = [];

export function MarketQuoteRow({ quote }: MarketQuoteRowProps) {
  if (quote.price !== null && quote.changePercent !== null && !quote.error) {
    return (
      <MarketRow
        changePercent={quote.changePercent}
        currency={quote.currency}
        name={quote.name}
        price={decimalPrice(quote.price)}
        sparkline={NO_SPARKLINE}
        symbol={quote.symbol}
      />
    );
  }
  return <PartialQuoteRow quote={quote} />;
}

/** A quote the feed could not fully price: keeps the reason or freshness visible. */
function PartialQuoteRow({ quote }: MarketQuoteRowProps) {
  const updateLabel = formatUpdatedAt(quote.updatedAt);
  const detail = quote.error ? ` · ${quote.error}` : updateLabel ? ` · ${updateLabel}` : "";

  return (
    <ListRow
      icon="market"
      subtitle={`${quote.symbol}${detail}`}
      title={quote.name}
      trailing={
        <View style={styles.price}>
          {quote.price === null ? (
            <Text variant="amountMd">--</Text>
          ) : (
            <Amount currency={quote.currency} value={decimalPrice(quote.price)} />
          )}
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

const styles = StyleSheet.create({
  price: { alignItems: "flex-end", gap: space[0.5] },
});
