import type { AccountType } from "@/data/ledger-client";

export interface AccountTypeOption {
  readonly type: AccountType;
  readonly emoji: string;
  readonly label: string;
}

export const ACCOUNT_TYPE_OPTIONS: readonly AccountTypeOption[] = [
  { type: "checking", emoji: "🏦", label: "Checking" },
  { type: "savings", emoji: "🐷", label: "Savings" },
  { type: "cash", emoji: "💵", label: "Cash" },
  { type: "credit_card", emoji: "💳", label: "Credit card" },
  { type: "investment", emoji: "📈", label: "Investment" },
  { type: "other", emoji: "🗂️", label: "Other" },
];

const FALLBACK_TYPE: AccountTypeOption = { type: "other", emoji: "🗂️", label: "Other" };

/** Emoji and label for an account type; unknown server values read as "Other". */
export function accountTypeOption(type: string | undefined): AccountTypeOption {
  return ACCOUNT_TYPE_OPTIONS.find((option) => option.type === type) ?? FALLBACK_TYPE;
}

export interface CurrencyOption {
  readonly code: string;
  readonly name: string;
}

export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { code: "USD", name: "US dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
  { code: "AED", name: "UAE dirham" },
  { code: "SAR", name: "Saudi riyal" },
  { code: "EGP", name: "Egyptian pound" },
  { code: "KWD", name: "Kuwaiti dinar" },
  { code: "QAR", name: "Qatari riyal" },
  { code: "JPY", name: "Japanese yen" },
  { code: "CNY", name: "Chinese yuan" },
  { code: "INR", name: "Indian rupee" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "AUD", name: "Australian dollar" },
  { code: "CHF", name: "Swiss franc" },
];

/** Picker options, keeping an account's existing currency selectable even when it isn't listed. */
export function currencyOptionsFor(current: string): readonly CurrencyOption[] {
  if (CURRENCY_OPTIONS.some((option) => option.code === current)) return CURRENCY_OPTIONS;
  return [{ code: current, name: current }, ...CURRENCY_OPTIONS];
}
