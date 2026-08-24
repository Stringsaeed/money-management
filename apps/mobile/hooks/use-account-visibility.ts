import { useActiveHousehold } from "@/hooks/use-households";
import { useLedgerAccounts } from "@/hooks/use-ledger";

export interface AccountVisibility {
  readonly cacheKey: string;
  readonly isFiltering: boolean;
  readonly visibleAccountIds: ReadonlySet<string>;
}

/**
 * Applies the server's API-authorized ledger view to local UI caches. An
 * active household fails closed while its authorized account list is loading
 * or unavailable, so retained local rows cannot reveal another member's
 * private Account.
 */
export function useAccountVisibility(): AccountVisibility {
  const { activeHousehold } = useActiveHousehold();
  const householdId = activeHousehold?.householdId ?? null;
  const { data: accounts = [] } = useLedgerAccounts(householdId);
  const isFiltering = householdId !== null;
  const visibleAccountIds = new Set(accounts.map((account) => account.id));

  return {
    cacheKey: isFiltering ? `${householdId}:${[...visibleAccountIds].join(",")}` : "local-only",
    isFiltering,
    visibleAccountIds,
  };
}

export function hasVisibleAccount(
  visibility: AccountVisibility,
  accountId: string | null | undefined,
): boolean {
  return (
    !visibility.isFiltering ||
    (typeof accountId === "string" && visibility.visibleAccountIds.has(accountId))
  );
}
