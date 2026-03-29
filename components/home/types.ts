import type { ReactElement } from "react";

import type { DayGroup } from "@/types";
import type { SectionHeaderItem } from "@/utils/journal-list";

export interface JournalDayHeaderProps {
  item: SectionHeaderItem;
}

export interface HomeJournalListProps {
  groups: DayGroup[];
  currency: string;
  showAccount: boolean;
  ListHeaderComponent: ReactElement;
}

export interface HomeEmptyStateProps {
  activeFilterCount: number;
  onResetFilters: () => void;
}
