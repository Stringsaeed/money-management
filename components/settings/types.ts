import type { AccountWithBalance, Category } from "@/types";

export interface SettingsRowProps {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightLabel?: string;
  noChevron?: boolean;
}

export interface AccountRowProps {
  account: AccountWithBalance;
}

export interface CategoryRowProps {
  category: Category;
}
