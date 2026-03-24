import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useColorScheme, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { computeTotalBalance, formatCents } from "@/utils/currency";

import type { BalanceHeroProps } from "./types";

export function BalanceHero({ accounts }: BalanceHeroProps) {
  const { totalCents, currency } = computeTotalBalance(accounts);
  const colorScheme = useColorScheme();
  const inkColor = colorScheme === "dark" ? "#E8E6E3" : "#1C1B1A";

  return (
    <View className="px-5 pt-safe-offset-12 pb-2 bg-background">
      {/* Balance amount */}
      <Text
        className="font-heading-medium text-[48px] leading-tight text-ink"
        style={{ fontVariant: ["tabular-nums"] }}
        selectable
      >
        {formatCents(totalCents, currency)}
      </Text>

      {/* Action buttons */}
      <View className="flex-row gap-3 mt-4 mb-2">
        <Button variant="outline" onPress={() => router.push("/transaction/new")}>
          <SymbolView name="plus" size={14} tintColor={inkColor} />
          <Text>Add Entry</Text>
        </Button>
      </View>
    </View>
  );
}
