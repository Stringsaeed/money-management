import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { QuoteRow } from "@/components/money-movement/quote-row";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { layoutTransition } from "@/components/transaction/constants";
import type { MarketAssetGroup, MarketQuote } from "@/hooks/use-market-quotes";

interface QuoteSectionProps {
  title: MarketAssetGroup;
  quotes: MarketQuote[];
}

export function QuoteSection({ title, quotes }: QuoteSectionProps) {
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut} layout={layoutTransition}>
      <View className="mx-5 flex-row items-center justify-between border-b border-ledger-outline pb-3">
        <Text className="font-heading-normal text-xl italic text-ink">{title}</Text>
        <Badge variant="outline" className="bg-surface">
          <Text>{quotes.length} tracked</Text>
        </Badge>
      </View>
      <View
        className="mx-5 overflow-hidden bg-surface-container"
        style={{ borderCurve: "continuous" }}
      >
        {quotes.map((quote, index) => (
          <QuoteRow key={quote.symbol} quote={quote} isLast={index === quotes.length - 1} />
        ))}
      </View>
    </Animated.View>
  );
}
