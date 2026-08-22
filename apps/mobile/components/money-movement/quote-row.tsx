import { View } from "react-native";
import { TrendDownIcon, TrendUpIcon } from "phosphor-react-native";

import { formatPrice, formatSignedPercent } from "@/components/money-movement/market-formatters";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { MarketQuote } from "@/hooks/use-market-quotes";
import { cn } from "@/lib/utils";

interface QuoteRowProps {
  quote: MarketQuote;
  isLast: boolean;
}

export function QuoteRow({ quote, isLast }: QuoteRowProps) {
  const isPositive = (quote.percentChange ?? 0) >= 0;
  const statusText = quote.errorMessage ?? quote.updatedAt ?? "latest quote";

  return (
    <View
      className={cn(
        "flex-row items-center gap-3 px-4 py-3.5",
        !isLast && "border-b border-ledger-outline",
      )}
    >
      <Text className="w-8 text-center text-xl">{quote.emoji}</Text>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="font-body-semibold text-base text-ink">{quote.label}</Text>
          <Text className="font-body-medium text-xs text-ink/40">{quote.symbol}</Text>
        </View>
        <Text className="font-body-normal text-xs text-ink/40">
          {quote.exchange ?? "Global"} · {statusText}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text
          className="font-body-semibold text-base text-ink"
          style={{ fontVariant: ["tabular-nums"] }}
          selectable
        >
          {formatPrice(quote.price, quote.currency)}
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon
            as={isPositive ? TrendUpIcon : TrendDownIcon}
            className={isPositive ? "text-sage" : "text-terracotta"}
            size={14}
          />
          <Text
            className={cn(
              "font-body-semibold text-xs",
              isPositive ? "text-sage" : "text-terracotta",
            )}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatSignedPercent(quote.percentChange)}
          </Text>
        </View>
      </View>
    </View>
  );
}
