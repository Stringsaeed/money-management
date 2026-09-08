import { ACCOUNT_CURRENCIES } from "@/components/account/account-form-options";

export interface AccountCurrencyOption {
  code: string;
  name: string;
  /** Localized symbol when it is short and distinct from the ISO code; otherwise null. */
  symbol: string | null;
}

function displayNames(locale?: string): Intl.DisplayNames {
  return new Intl.DisplayNames(locale ? [locale] : undefined, { type: "currency" });
}

export function getCurrencyDisplayName(code: string, locale?: string): string {
  try {
    return displayNames(locale).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Returns a currency symbol only when Intl produces a short, unambiguous glyph
 * that is not just the ISO code itself (e.g. "$" for USD, not "AED" for AED).
 */
export function getReliableCurrencySymbol(code: string, locale?: string): string | null {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const symbol = parts.find((part) => part.type === "currency")?.value?.trim();
    if (!symbol) return null;
    if (symbol.toUpperCase() === code.toUpperCase()) return null;
    if (symbol.length > 3) return null;
    return symbol;
  } catch {
    return null;
  }
}

export function toAccountCurrencyOption(code: string, locale?: string): AccountCurrencyOption {
  return {
    code,
    name: getCurrencyDisplayName(code, locale),
    symbol: getReliableCurrencySymbol(code, locale),
  };
}

export function listAccountCurrencyOptions(locale?: string): AccountCurrencyOption[] {
  return ACCOUNT_CURRENCIES.map((code) => toAccountCurrencyOption(code, locale));
}

export function filterAccountCurrencyOptions(
  options: readonly AccountCurrencyOption[],
  query: string,
): AccountCurrencyOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...options];

  return options.filter(
    (option) =>
      option.code.toLowerCase().includes(normalized) ||
      option.name.toLowerCase().includes(normalized),
  );
}
