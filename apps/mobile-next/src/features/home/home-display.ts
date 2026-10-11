import type { V2Account, V2Transaction } from "@trove/api/v2/contracts";
import { DEFAULT_BUDGET_CURRENCY } from "@/data/budget-currency";
import type { AuthPrincipal } from "@/features/auth/auth-types";
import { initialsFor } from "@/ui/trove";

export function homeIdentity(principal: AuthPrincipal | null) {
  if (principal?.kind === "user") {
    const email = principal.email.trim();
    return {
      name: principal.name.trim().split(/\s+/)[0] || "there",
      initials: initialsFor(principal.name) || initialsFor(email),
    };
  }
  return { name: "friend", initials: "G" };
}

/** `Morning` until noon, `Afternoon` until five, then `Evening`. */
export function homeGreeting(hour: number): string {
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

/**
 * Home's currency: the budget's when one is chosen, else the currency most active accounts hold
 * (ties go alphabetically), so a multi-currency ledger opens on its main money. With no accounts
 * it falls back to the app's default budget currency.
 */
export function homeCurrency(
  accounts: readonly V2Account[],
  budgetCurrency: string | null,
): string {
  const active = accounts.filter((account) => !account.archived);
  if (budgetCurrency && active.some((account) => account.currency === budgetCurrency)) {
    return budgetCurrency;
  }
  const counts = new Map<string, number>();
  for (const account of active)
    counts.set(account.currency, (counts.get(account.currency) ?? 0) + 1);
  // Hermes has no Array#toSorted; spreading already copies.
  const ranked = [...counts].sort(
    ([leftCode, left], [rightCode, right]) => right - left || leftCode.localeCompare(rightCode),
  );
  return ranked[0]?.[0] ?? budgetCurrency ?? DEFAULT_BUDGET_CURRENCY;
}

/** Trove `Amount` takes signed minor units: spending is negative, money in positive. */
export function signedMinor(kind: V2Transaction["kind"], amountMinor: number) {
  return kind === "expense" ? -Math.abs(amountMinor) : Math.abs(amountMinor);
}
