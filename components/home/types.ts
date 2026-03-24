import type { AccountWithBalance } from "@/types";

export interface BalanceHeroProps {
  accounts: AccountWithBalance[];
}

export interface AccountsSectionProps {
  accounts: AccountWithBalance[];
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
