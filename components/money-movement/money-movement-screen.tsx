import { Stack } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { MarketHero } from "@/components/money-movement/market-hero";
import { MarketStateCard } from "@/components/money-movement/market-state-card";
import { QuoteSection } from "@/components/money-movement/quote-section";
import {
  hasTwelveDataApiKey,
  MARKET_ASSETS,
  type MarketAssetGroup,
  useMarketQuotes,
} from "@/hooks/use-market-quotes";

const GROUPS: MarketAssetGroup[] = ["Stocks", "Metals", "Crypto"];

export function MoneyMovementScreen() {
  const hasApiKey = hasTwelveDataApiKey();
  const { data: quotes = [], isFetching, isLoading, error, refetch } = useMarketQuotes();
  const handleRefresh = () => {
    refetch();
  };

  const quotesByGroup = GROUPS.map((group) => ({
    group,
    quotes: quotes.filter((quote) => quote.group === group),
  }));

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Money Movement" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 pt-safe-offset-20 pb-safe-offset-10"
      >
        <MarketHero hasApiKey={hasApiKey} isFetching={isFetching} onRefresh={handleRefresh} />

        {!hasApiKey ? (
          <MarketStateCard
            title="Connect Twelve Data 🔌"
            message="Add EXPO_PUBLIC_TWELVE_DATA_API_KEY to the app environment to stream live stocks, metals, and crypto quotes."
          />
        ) : null}

        {hasApiKey && isLoading ? <ActivityIndicator className="mt-5" /> : null}

        {hasApiKey && error ? (
          <MarketStateCard
            title="Market feed paused"
            message={error instanceof Error ? error.message : "Twelve Data could not load quotes."}
          />
        ) : null}

        {hasApiKey && quotes.length > 0
          ? quotesByGroup.map(({ group, quotes: groupQuotes }) => (
              <QuoteSection key={group} title={group} quotes={groupQuotes} />
            ))
          : null}

        {hasApiKey && !isLoading && quotes.length === 0 && !error ? (
          <MarketStateCard
            title="No quotes yet"
            message={`Twelve Data is ready for ${MARKET_ASSETS.length} tracked markets. Tap Refresh to try again.`}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
