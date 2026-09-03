import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AuthorizedLedgerAccount } from "@/hooks/use-authorized-ledger-accounts";
import { useAccountDataSource } from "@/modules/ledger-data-source/coordinator";
import { cohereLedgerCache } from "@/modules/ledger-cache";

/** Updates visibility through the Account resource. Local-only ledgers have no remote toggle. */
export function useAccountPrivacy(
  account: AuthorizedLedgerAccount | undefined,
  householdId: string | null,
) {
  const source = useAccountDataSource();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isPrivate: boolean) => {
      if (!account || !householdId) {
        throw new Error("This account is not available in the active household.");
      }
      await source.accounts.update(account.id, {
        visibility: isPrivate ? "private" : "public",
      });
    },
    onSuccess: async () => {
      if (!account) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ledger-authorization", "accounts", householdId],
        }),
        cohereLedgerCache(queryClient, { kind: "account.updated", id: account.id }),
      ]);
    },
  });
}
