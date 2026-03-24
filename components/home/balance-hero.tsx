import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, useColorScheme, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { computeTotalBalance, formatCents } from "@/utils/currency";
import { formatHeaderDate } from "@/utils/date";

import type { BalanceHeroProps } from "./types";

export function BalanceHero({ accounts, activeFilterCount }: BalanceHeroProps) {
  const { totalCents, currency } = computeTotalBalance(accounts);
  const colorScheme = useColorScheme();
  const inkColor = colorScheme === "dark" ? "#E8E6E3" : "#1C1B1A";
  const mutedIconColor = colorScheme === "dark" ? "#6B6966" : "#9CA3AF";

  return (
    <View className="px-5 pt-safe-offset-4 pb-2 bg-background">
      {/* Top row: date label + action buttons */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-body-semibold text-[11px] text-ink/40 uppercase tracking-wider">
          AS OF {formatHeaderDate()}
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/(tabs)/filters")}
            className="w-8 h-8 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim"
            style={{ borderCurve: "continuous" }}
          >
            <SymbolView
              name="line.3.horizontal.decrease.circle"
              size={20}
              tintColor={activeFilterCount > 0 ? inkColor : mutedIconColor}
              weight={activeFilterCount > 0 ? "semibold" : "regular"}
            />
            {activeFilterCount > 0 && (
              <View className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink items-center justify-center">
                <Text className="text-[9px] font-bold text-background">{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/settings")}
            className="w-8 h-8 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim"
            style={{ borderCurve: "continuous" }}
          >
            <SymbolView name="gearshape" size={18} tintColor={mutedIconColor} />
          </Pressable>
        </View>
      </View>

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
