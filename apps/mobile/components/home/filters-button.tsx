import { ArrowCounterClockwiseIcon, FunnelSimpleIcon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useAllCategories } from "@/hooks/use-categories";
import { useTransactionDateRange } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { formatMonth, monthsBetween } from "@/utils/date";

import { styles } from "./styles";

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
      style={[
        styles.filterRowChip,
        selected ? styles.filterRowChipSelected : styles.filterRowChipUnselected,
      ]}
    >
      <Text
        style={[
          styles.filterRowText,
          selected ? styles.filterRowTextSelected : styles.filterRowTextUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSectionGap}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterSectionRow}>{children}</View>
    </View>
  );
}

export function FiltersButton() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

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
        onPress={() => setOpen(true)}
        style={styles.filtersButtonWrap}
      >
        <Icon as={FunnelSimpleIcon} size={22} style={styles.filtersButtonIcon} />
        {activeFilterCount > 0 ? (
          <View style={styles.filtersBadge}>
            <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View style={[styles.filtersSheetContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.filtersSheetHeader}>
            <Text style={styles.filtersSheetTitle}>Filters</Text>
            {activeFilterCount > 0 ? (
              <Pressable onPress={resetFilters} style={styles.filtersResetButton}>
                <Icon as={ArrowCounterClockwiseIcon} size={14} style={styles.filtersResetIcon} />
                <Text style={styles.filtersResetText}>Reset</Text>
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
