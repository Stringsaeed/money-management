import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useMarketQuotesQuery, type V2MarketQuote } from "@/data/market-queries";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";

import { MarketQuoteRow } from "./market-quote-row";

const GROUP_ORDER = ["stocks", "metals", "crypto"] as const;
type MarketGroup = (typeof GROUP_ORDER)[number];
type MarketListItem =
  | { readonly id: string; readonly type: "header"; readonly group: MarketGroup }
  | { readonly id: string; readonly type: "quote"; readonly quote: V2MarketQuote };

export function MarketScreen() {
  const query = useMarketQuotesQuery();
  const groups = marketRows(query.data);

  if (query.isLoading && query.data.length === 0)
    return (
      <Screen>
        <Text style={styles.status}>Loading Market…</Text>
      </Screen>
    );
  if (query.isError && query.data.length === 0)
    return (
      <Screen>
        <EmptyState
          title="Market is unavailable"
          message="Check your connection and try again."
          onRetry={() => void query.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <LegendList
        data={groups}
        keyExtractor={(item) => item.id}
        estimatedItemSize={64}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headline">Market</Text>
            <Text style={styles.description}>Live quotes for stocks, metals, and crypto.</Text>
            <Button
              title={query.isFetching ? "Refreshing…" : "Refresh"}
              onPress={() => void query.retry()}
              loading={query.isFetching}
            />
            <>
              {query.isError ? (
                <Surface variant="recessed">
                  <Text style={styles.warning}>
                    Some quotes could not refresh. Existing values are shown where available.
                  </Text>
                </Surface>
              ) : null}
            </>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No quotes yet"
            message="Market data will appear when the feed responds."
            onRetry={() => void query.retry()}
          />
        }
        renderItem={({ item }) =>
          item.type === "header" ? (
            <Text variant="title" style={styles.group}>
              {formatGroupLabel(item.group)}
            </Text>
          ) : (
            <MarketQuoteRow quote={item.quote} />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

function marketRows(data: readonly V2MarketQuote[]): readonly MarketListItem[] {
  return GROUP_ORDER.flatMap((group) => {
    const items = data.filter((quote) => quote.group === group);
    return items.length > 0
      ? [
          { id: `group:${group}`, type: "header" as const, group },
          ...items.map((quote) => ({ id: quote.id, type: "quote" as const, quote })),
        ]
      : [];
  });
}

function formatGroupLabel(group: MarketGroup): string {
  return group[0].toUpperCase() + group.slice(1);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[2],
    paddingBottom: spacing[24],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: { gap: spacing[3], paddingBottom: spacing[3] },
  description: { color: colors.mutedForeground },
  warning: { color: colors.textWarning },
  group: { paddingTop: spacing[3] },
  separator: { backgroundColor: colors.ledgerOutline, height: 1 },
  status: { color: colors.mutedForeground, padding: spacing[5] },
});
