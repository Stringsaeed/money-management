import { ActivityIndicator, ScrollView, View } from "react-native";

import { MarketHero } from "@/components/money-movement/market-hero";
import { MarketStateCard } from "@/components/money-movement/market-state-card";
import { QuoteSection } from "@/components/money-movement/quote-section";
import {
  hasMarketDataApiKeys,
  MARKET_ASSETS,
  type MarketAssetGroup,
  useMarketQuotes,
} from "@/hooks/use-market-quotes";

const GROUPS: MarketAssetGroup[] = ["Stocks", "Metals", "Crypto"];

export function MoneyMovementScreen() {
  const hasApiKey = hasMarketDataApiKeys();
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
      {/* <Stack.Screen options={{ title: "Money Movement" }} /> */}
      <ScrollView contentContainerClassName="gap-5 pt-safe-offset-20 pb-safe-offset-10">
        <MarketHero hasApiKey={hasApiKey} isFetching={isFetching} onRefresh={handleRefresh} />

        {!hasApiKey ? (
          <MarketStateCard
            title="Connect market APIs 🔌"
            message="Add EXPO_PUBLIC_TWELVE_DATA_API_KEY for stocks, EXPO_PUBLIC_METALS_DEV_API_KEY for metals, or EXPO_PUBLIC_FREECRYPTO_API_KEY for crypto quotes."
          />
        ) : null}

        {hasApiKey && isLoading ? <ActivityIndicator className="mt-5" /> : null}

        {hasApiKey && error ? (
          <MarketStateCard
            title="Market feed paused"
            message={error instanceof Error ? error.message : "Market APIs could not load quotes."}
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
            message={`Market APIs are ready for ${MARKET_ASSETS.length} tracked markets. Tap Refresh to try again.`}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
