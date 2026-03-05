import { ForwardedRef, useMemo, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";
import { SymbolView } from "expo-symbols";

import { Text } from "@/components/ui/text";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useTransactionDateRange } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatMonth, monthsBetween } from "@/utils/date";
import { TrueSheet } from "@lodev09/react-native-true-sheet";

// ─── FilterRow ────────────────────────────────────────────────────────────────

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
      <Text className="text-[15px] text-gray-500">{label}</Text>
      {children}
    </View>
  );
}

function DropdownValue({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Text className="text-[15px] font-medium text-gray-900">{label}</Text>
      <SymbolView name="chevron.down" size={11} tintColor="#9ca3af" weight="semibold" />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FiltersScreen({ ref }: { ref: ForwardedRef<TrueSheet> }) {
  const {
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    activeAccountId,
    setActiveAccountId,
    selectedCategoryId,
    setSelectedCategoryId,
    resetFilters,
  } = useUIStore();

  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: allCategories = [] } = useCategories();
  const { data: dateRange } = useTransactionDateRange();

  const availableMonths = useMemo(
    () => monthsBetween(dateRange?.minDate, dateRange?.maxDate),
    [dateRange?.minDate, dateRange?.maxDate],
  );

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const activeCategory = allCategories.find((c) => c.id === selectedCategoryId);
  const activeFilterCount = [activeAccountId, selectedMonth, selectedCategoryId].filter(
    Boolean,
  ).length;

  return (
    <View className="pt-safe pb-safe bg-white">
      {/* Account row */}
      <FilterRow label="Account">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Pressable className="active:opacity-60">
              <DropdownValue label={activeAccount?.name ?? "All Accounts"} />
            </Pressable>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.CheckboxItem
              key="acc-all"
              value={activeAccountId === null ? "on" : "off"}
              onValueChange={() => setActiveAccountId(null)}
            >
              <DropdownMenu.ItemTitle>All Accounts</DropdownMenu.ItemTitle>
              <DropdownMenu.ItemIndicator />
            </DropdownMenu.CheckboxItem>
            {accounts.map((acc) => (
              <DropdownMenu.CheckboxItem
                key={acc.id}
                value={activeAccountId === acc.id ? "on" : "off"}
                onValueChange={(next) => setActiveAccountId(next === "on" ? acc.id : null)}
              >
                <DropdownMenu.ItemTitle>{acc.name}</DropdownMenu.ItemTitle>
                <DropdownMenu.ItemIndicator />
              </DropdownMenu.CheckboxItem>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </FilterRow>

      {/* Period row */}
      <FilterRow label="Period">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Pressable className="active:opacity-60">
              <DropdownValue
                label={
                  selectedYear && selectedMonth
                    ? formatMonth(selectedYear, selectedMonth)
                    : "All Time"
                }
              />
            </Pressable>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.CheckboxItem
              key="period-all"
              value={selectedMonth === null ? "on" : "off"}
              onValueChange={() => setSelectedMonth(null, null)}
            >
              <DropdownMenu.ItemTitle>All Time</DropdownMenu.ItemTitle>
              <DropdownMenu.ItemIndicator />
            </DropdownMenu.CheckboxItem>
            {availableMonths.map(({ year, month }) => {
              const isSelected = year === selectedYear && month === selectedMonth;
              return (
                <DropdownMenu.CheckboxItem
                  key={`${year}-${month}`}
                  value={isSelected ? "on" : "off"}
                  onValueChange={(next) =>
                    next === "on" ? setSelectedMonth(year, month) : setSelectedMonth(null, null)
                  }
                >
                  <DropdownMenu.ItemTitle>{formatMonth(year, month)}</DropdownMenu.ItemTitle>
                  <DropdownMenu.ItemIndicator />
                </DropdownMenu.CheckboxItem>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </FilterRow>

      {/* Category row */}
      <FilterRow label="Category">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Pressable className="active:opacity-60">
              <DropdownValue label={activeCategory?.name ?? "All Categories"} />
            </Pressable>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.CheckboxItem
              key="cat-all"
              value={selectedCategoryId === null ? "on" : "off"}
              onValueChange={() => setSelectedCategoryId(null)}
            >
              <DropdownMenu.ItemTitle>All Categories</DropdownMenu.ItemTitle>
              <DropdownMenu.ItemIndicator />
            </DropdownMenu.CheckboxItem>
            {allCategories.map((cat) => (
              <DropdownMenu.CheckboxItem
                key={cat.id}
                value={selectedCategoryId === cat.id ? "on" : "off"}
                onValueChange={(next) => setSelectedCategoryId(next === "on" ? cat.id : null)}
              >
                <DropdownMenu.ItemTitle>{cat.name}</DropdownMenu.ItemTitle>
                <DropdownMenu.ItemIndicator />
              </DropdownMenu.CheckboxItem>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </FilterRow>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <View className="px-4 pt-4">
          <Pressable
            onPress={resetFilters}
            className="py-3.5 rounded-2xl bg-gray-100 items-center active:opacity-70"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="text-[15px] font-medium text-red-500">Reset All Filters</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
