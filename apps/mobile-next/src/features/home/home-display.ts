import type { V2Account, V2RecurringRule, V2Transaction } from "@trove/api/v2/contracts";
import type { UpcomingOccurrence } from "@/data/ledger-schemas";
import type { AuthPrincipal } from "@/features/auth/auth-types";
import { currencyFractionDigits } from "@/utils/money";

export function homeIdentity(principal: AuthPrincipal | null) {
  if (principal?.kind === "user") {
    return {
      name: principal.name.trim().split(/\s+/)[0] || "there",
      seed: principal.email.trim().toLowerCase(),
    };
  }
  return { name: "friend", seed: principal?.guestSessionId ?? "guest" };
}

export function homeSelection(
  accounts: readonly V2Account[],
  preferredCurrency: string | undefined,
  preferredAccount: string | null,
) {
  const activeAccounts = accounts.filter((account) => !account.archived);
  const available = [...new Set(activeAccounts.map((account) => account.currency))].sort();
  const currency =
    preferredCurrency && available.includes(preferredCurrency)
      ? preferredCurrency
      : (available[0] ?? "USD");
  const selected = activeAccounts.find(
    (account) => account.id === preferredAccount && account.currency === currency,
  );
  const accountId = selected?.id ?? null;
  const accountIds = new Set(
    activeAccounts
      .filter(
        (account) => account.currency === currency && (!accountId || account.id === accountId),
      )
      .map((account) => account.id),
  );
  return {
    currency,
    currencies: available.length ? available : [currency],
    accountId,
    accountIds,
    accountLabel: selected?.name ?? "All accounts",
  };
}

export function recentHomeActivity(
  transactions: readonly V2Transaction[],
  currency: string,
  startDate: string,
  endDate: string,
  accountIds: ReadonlySet<string>,
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.currency === currency &&
        transaction.date >= startDate &&
        transaction.date <= endDate &&
        (accountIds.has(transaction.accountId) ||
          (transaction.toAccountId !== null && accountIds.has(transaction.toAccountId))),
    )
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt),
    )
    .slice(0, 5);
}

export function upcomingHomeActivity(
  occurrences: readonly UpcomingOccurrence[],
  rules: readonly V2RecurringRule[],
  currency: string,
  accountId: string | null,
) {
  const ruleMap = new Map(rules.map((rule) => [rule.id, rule]));
  return occurrences
    .flatMap((occurrence) => {
      const rule = ruleMap.get(occurrence.ruleId);
      if (!rule || occurrence.currency !== currency) return [];
      if (accountId && rule.accountId !== accountId && rule.toAccountId !== accountId) return [];
      return [{ ...occurrence, name: rule.name }];
    })
    .slice(0, 5);
}

export function formatChartMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value / 10 ** currencyFractionDigits(currency));
}
