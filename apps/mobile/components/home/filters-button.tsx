import { ArrowCounterClockwiseIcon, FunnelSimpleIcon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useAllCategories } from "@/hooks/use-categories";
import { useTransactionDateRange } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatMonth, monthsBetween } from "@/utils/date";

function FilterRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 ${selected ? "bg-ink" : "bg-surface-container"}`}
    >
      <Text className={`font-body-medium text-[13px] ${selected ? "text-surface" : "text-ink"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="font-heading-normal text-lg italic text-ink">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

export function FiltersButton() {
  const [sheetIndex, setSheetIndex] = useState(0);

  const {
    activeAccountId,
    selectedYear,
    selectedMonth,
    selectedCategoryId,
    setActiveAccountId,
    setSelectedMonth,
    setSelectedCategoryId,
    resetFilters,
  } = useUIStore();
  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: allCategories = [] } = useAllCategories();
  const { data: dateRange } = useTransactionDateRange();

  const activeFilterCount = [activeAccountId, selectedMonth, selectedCategoryId].filter(
    Boolean,
  ).length;
  const availableMonths = monthsBetween(dateRange?.minDate, dateRange?.maxDate);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filters"
        onPress={() => setSheetIndex(1)}
        className="mr-1 h-9 w-9 items-center justify-center"
      >
        <Icon as={FunnelSimpleIcon} size={22} className="text-foreground" />
        {activeFilterCount > 0 ? (
          <View className="absolute right-0 top-0 h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1">
            <Text className="font-body-medium text-[10px] text-surface">{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <ModalBottomSheet
        index={sheetIndex}
        onIndexChange={setSheetIndex}
        scrimColor="rgba(0, 0, 0, 0.5)"
        surface={<View className="absolute inset-0 rounded-t-3xl bg-background" />}
      >
        <View className="p-4.5 pb-safe gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-heading-normal text-2xl italic text-ink">Filters</Text>
            {activeFilterCount > 0 ? (
              <Pressable
                onPress={resetFilters}
                className="flex-row items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5"
              >
                <Icon as={ArrowCounterClockwiseIcon} size={14} className="text-ink" />
                <Text className="font-body-medium text-[13px] text-ink">Reset</Text>
              </Pressable>
            ) : null}
          </View>

          <FilterSection title="Account">
            <FilterRow
              label="All Accounts"
              selected={activeAccountId === null}
              onPress={() => setActiveAccountId(null)}
            />
            {accounts.map((account) => (
              <FilterRow
                key={account.id}
                label={account.name}
                selected={activeAccountId === account.id}
                onPress={() =>
                  setActiveAccountId(activeAccountId === account.id ? null : account.id)
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="Period">
            <FilterRow
              label="All Time"
              selected={selectedMonth === null}
              onPress={() => setSelectedMonth(null, null)}
            />
            {availableMonths.map(({ year, month }) => {
              const selected = year === selectedYear && month === selectedMonth;
              return (
                <FilterRow
                  key={`${year}-${month}`}
                  label={formatMonth(year, month)}
                  selected={selected}
                  onPress={() =>
                    selected ? setSelectedMonth(null, null) : setSelectedMonth(year, month)
                  }
                />
              );
            })}
          </FilterSection>

          <FilterSection title="Category">
            <FilterRow
              label="All Categories"
              selected={selectedCategoryId === null}
              onPress={() => setSelectedCategoryId(null)}
            />
            {allCategories.map((category) => (
              <FilterRow
                key={category.id}
                label={category.name}
                selected={selectedCategoryId === category.id}
                onPress={() =>
                  setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)
                }
              />
            ))}
          </FilterSection>
        </View>
      </ModalBottomSheet>
    </>
  );
}
