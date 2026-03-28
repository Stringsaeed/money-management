import type { ReactElement } from "react";

import type { CategorySpendingDatum, MonthlyTrendDatum } from "@/hooks/use-chart-data";
import type { DayGroup } from "@/types";
import type { SectionHeaderItem } from "@/utils/journal-list";

export interface BalanceHeroProps {
  balanceCents: number;
  currency: string;
}

export interface FilterBarProps {
  activeAccountName: string | null;
  selectedYear: number | null;
  selectedMonth: number | null;
  selectedCategoryName: string | null;
  summary: { totalIncome: number; totalExpense: number; netAmount: number } | undefined;
  currency: string;
  setActiveAccountId: (id: string | null) => void;
  setSelectedMonth: (year: number | null, month: number | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
}

export interface JournalDayHeaderProps {
  item: SectionHeaderItem;
}

export interface HomeJournalListProps {
  groups: DayGroup[];
  currency: string;
  showAccount: boolean;
  ListHeaderComponent: ReactElement;
}

export interface HomeListHeaderProps {
  activeAccountName: string | null;
  selectedYear: number | null;
  selectedMonth: number | null;
  selectedCategoryName: string | null;
  summary: { totalIncome: number; totalExpense: number; netAmount: number } | undefined;
  currency: string;
  filteredBalance: number;
  categorySpending: CategorySpendingDatum[];
  monthlyTrend: MonthlyTrendDatum[];
  setActiveAccountId: (id: string | null) => void;
  setSelectedMonth: (year: number | null, month: number | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
}

export interface HomeEmptyStateProps {
  activeFilterCount: number;
  onResetFilters: () => void;
}
