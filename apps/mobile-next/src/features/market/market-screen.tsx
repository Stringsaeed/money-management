import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useMarketQuotesQuery, type V2MarketQuote } from "@/data/market-queries";
import {
  Banner,
  Button,
  EmptyState,
  Header,
  layout,
  ListGroup,
  radius,
  Screen,
  Skeleton,
  space,
  Text,
} from "@/ui/trove";

import { MarketQuoteRow } from "./market-quote-row";

const GROUP_ORDER = ["stocks", "metals", "crypto"] as const;
type MarketGroup = (typeof GROUP_ORDER)[number];
interface MarketSection {
  readonly group: MarketGroup;
  readonly quotes: readonly V2MarketQuote[];
}

export function MarketScreen() {
  const query = useMarketQuotesQuery();
  const sections = marketSections(query.data);

  if (query.isLoading && query.data.length === 0)
    return (
      <Screen>
        <View
          accessible
          accessibilityLabel="Loading Market"
          accessibilityState={{ busy: true }}
          style={styles.loading}
        >
          <Skeleton height={space[10]} width="40%" />
          <Skeleton borderRadius={radius.lg} height={space[16] + space[10]} />
          <Skeleton borderRadius={radius.lg} height={space[16] + space[10]} />
        </View>
      </Screen>
    );
  if (query.isError && query.data.length === 0)
    return (
      <Screen style={styles.empty}>
        <EmptyState
          icon="market"
          title="Market is unavailable"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void query.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <LegendList
        data={sections}
        keyExtractor={(item) => item.group}
        estimatedItemSize={200}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Header title="Market" />
            <Text tone="secondary" variant="bodyMd">
              Live quotes for stocks, metals, and crypto.
            </Text>
            <Button
              fullWidth
              label={query.isFetching ? "Refreshing…" : "Refresh"}
              loading={query.isFetching}
              onPress={() => void query.retry()}
            />
            {query.isError ? (
              <Banner
                message="Some quotes could not refresh. Existing values are shown where available."
                tone="warning"
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="market"
            title="No quotes yet"
            message="Market data will appear when the feed responds."
            actionLabel="Try again"
            onAction={() => void query.retry()}
          />
        }
        renderItem={({ item }) => (
          <ListGroup dividerInset={layout.cardPadding} header={formatGroupLabel(item.group)}>
            {item.quotes.map((quote) => (
              <MarketQuoteRow key={quote.id} quote={quote} />
            ))}
          </ListGroup>
        )}
        ItemSeparatorComponent={Separator}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function marketSections(data: readonly V2MarketQuote[]): readonly MarketSection[] {
  return GROUP_ORDER.flatMap((group) => {
    const quotes = data.filter((quote) => quote.group === group);
    return quotes.length > 0 ? [{ group, quotes }] : [];
  });
}

function formatGroupLabel(group: MarketGroup): string {
  return group[0].toUpperCase() + group.slice(1);
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space[16] + space[8],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[3],
  },
  header: { gap: space[3], paddingBottom: space[4] },
  loading: { gap: space[4], paddingHorizontal: layout.screenGutter, paddingTop: space[4] },
  empty: { justifyContent: "center", paddingHorizontal: layout.screenGutter },
  separator: { height: space[4] },
});
