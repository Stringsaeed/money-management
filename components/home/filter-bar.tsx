import { ScrollView, View } from "react-native";
import { XIcon } from "phosphor-react-native";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatCents } from "@/utils/currency";
import { formatMonth } from "@/utils/date";
import { cn } from "@/lib/utils";

import type { FilterBarProps } from "./types";

export function FilterBar({
  activeAccountName,
  selectedYear,
  selectedMonth,
  selectedCategoryName,
  summary,
  currency,
  setActiveAccountId,
  setSelectedMonth,
  setSelectedCategoryId,
}: FilterBarProps) {
  const hasChips = !!(activeAccountName || selectedMonth || selectedCategoryName);
  if (!hasChips) return null;

  return (
    <View className="bg-background">
      {/* Active filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}
      >
        {activeAccountName && (
          <Badge>
            <Text className="font-body-medium text-xs">{activeAccountName}</Text>
            <Button onPress={() => setActiveAccountId(null)} variant="outline" size="icon">
              <Icon as={XIcon} />
            </Button>
          </Badge>
        )}
        {selectedYear && selectedMonth && (
          <Badge>
            <Text className="font-body-medium text-xs">
              {formatMonth(selectedYear, selectedMonth)}
            </Text>
            <Button onPress={() => setSelectedMonth(null, null)} variant="outline" size="icon">
              <Icon as={XIcon} />
            </Button>
          </Badge>
        )}
        {selectedCategoryName && (
          <Badge>
            <Text className="font-body-medium text-xs">{selectedCategoryName}</Text>
            <Button onPress={() => setSelectedCategoryId(null)} variant="outline" size="icon">
              <Icon as={XIcon} />
            </Button>
          </Badge>
        )}
      </ScrollView>

      {/* Monthly summary */}
      {summary && selectedMonth && (
        <View className="flex-row items-center gap-5 px-5 pb-3">
          <View className="items-start">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wide mb-0.5">
              Income
            </Text>
            <Text
              className="font-heading-normal text-sm text-sage"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              +{formatCents(summary.totalIncome, currency)}
            </Text>
          </View>
          <View className="w-px h-6 bg-ledger-outline" />
          <View className="items-start">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wide mb-0.5">
              Spent
            </Text>
            <Text
              className="font-heading-normal text-sm text-terracotta"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              -{formatCents(summary.totalExpense, currency)}
            </Text>
          </View>
          <View className="w-px h-6 bg-ledger-outline" />
          <View className="items-start">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wide mb-0.5">
              Net
            </Text>
            <Text
              className={cn(
                "font-heading-normal text-sm",
                summary.netAmount >= 0 ? "text-sage" : "text-terracotta",
              )}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {summary.netAmount >= 0 ? "+" : ""}
              {formatCents(summary.netAmount, currency)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
