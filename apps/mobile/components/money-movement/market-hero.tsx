import { View } from "react-native";

import { MarketSourceBadge } from "@/components/money-movement/market-source-badge";
import { RefreshMarketButton } from "@/components/money-movement/refresh-market-button";
import { Text } from "@/components/ui/text";

interface MarketHeroProps {
  hasApiKey: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

export function MarketHero({ hasApiKey, isFetching, onRefresh }: MarketHeroProps) {
  return (
    <View className="mx-5 gap-5">
      <View className="gap-3">
        <Text className="font-body-normal text-base leading-7 text-ink/50">
          Live board for top US stocks by market cap, gold, silver, and top crypto pairs.
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <MarketSourceBadge />
        <RefreshMarketButton disabled={!hasApiKey || isFetching} onPress={onRefresh} />
      </View>
    </View>
  );
}
