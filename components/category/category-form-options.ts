import { Colors } from "@/constants/theme";

export type CategoryType = "expense" | "income";

interface CategoryTypeOption {
  value: CategoryType;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export const CATEGORY_TYPE_OPTIONS: CategoryTypeOption[] = [
  {
    value: "expense",
    label: "Expense",
    emoji: "💸",
    description: "Money going out — bills, food, shopping, and the like.",
    color: Colors.light.expense,
  },
  {
    value: "income",
    label: "Income",
    emoji: "💰",
    description: "Money coming in — salary, refunds, gifts, and payouts.",
    color: Colors.light.income,
  },
];

export const CATEGORY_TYPE_META = CATEGORY_TYPE_OPTIONS.reduce(
  (map, option) => {
    map[option.value] = option;
    return map;
  },
  {} as Record<CategoryType, CategoryTypeOption>,
);

export const DEFAULT_CATEGORY_ICON = "🏷️";
