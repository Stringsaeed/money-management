import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { formatCents } from "@/utils/currency";

import type { BalanceHeroProps } from "./types";

export function BalanceHero({ balanceCents, currency }: BalanceHeroProps) {
  return (
    <View className="px-5 pb-2 bg-background">
      <Text
        className="font-heading-medium text-[48px] leading-tight text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
        selectable
      >
        {formatCents(balanceCents, currency)}
      </Text>
    </View>
  );
}
