import type { AccountWithBalance, Category } from "@/types";

export interface SettingsRowProps {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightLabel?: string;
  noChevron?: boolean;
  testID?: string;
}

export interface AccountRowProps {
  account: AccountWithBalance;
  onPress?: () => void;
}

export interface CategoryRowProps {
  category: Category;
  onPress?: () => void;
}
