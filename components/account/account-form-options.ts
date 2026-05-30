import { AccountTypeColors } from "@/constants/theme";
import type { AccountType } from "@/types";

interface AccountTypeOption {
  value: AccountType;
  label: string;
  emoji: string;
  systemIcon: string;
  description: string;
  color: string;
}

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    value: "checking",
    label: "Checking",
    emoji: "💳",
    systemIcon: "creditcard.fill",
    description: "For everyday spending, bills, and quick transfers.",
    color: AccountTypeColors.checking,
  },
  {
    value: "savings",
    label: "Savings",
    emoji: "🏦",
    systemIcon: "building.columns.fill",
    description: "For goals, rainy-day funds, and cash you keep parked.",
    color: AccountTypeColors.savings,
  },
  {
    value: "cash",
    label: "Cash",
    emoji: "💵",
    systemIcon: "banknote.fill",
    description: "For wallets, envelopes, and cash-on-hand balances.",
    color: AccountTypeColors.cash,
  },
  {
    value: "credit_card",
    label: "Credit Card",
    emoji: "💳",
    systemIcon: "creditcard.circle.fill",
    description: "For cards you pay down and want to watch closely.",
    color: AccountTypeColors.credit_card,
  },
  {
    value: "investment",
    label: "Investment",
    emoji: "📈",
    systemIcon: "chart.line.uptrend.xyaxis.circle.fill",
    description: "For brokerage, crypto, and longer-term growth accounts.",
    color: AccountTypeColors.investment,
  },
  {
    value: "other",
    label: "Other",
    emoji: "🏧",
    systemIcon: "tray.full.fill",
    description: "For anything that does not fit the usual account buckets.",
    color: AccountTypeColors.other,
  },
];

export const ACCOUNT_TYPE_META = ACCOUNT_TYPE_OPTIONS.reduce(
  (map, option) => {
    map[option.value] = option;
    return map;
  },
  {} as Record<AccountType, AccountTypeOption>,
);

export const ACCOUNT_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "SAR",
  "AED",
  "INR",
  "BRL",
  "MXN",
];
