import { useMutation, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";
import type { LedgerAccount } from "@/hooks/use-ledger";
import { generateId } from "@/utils/id";

/** Updates server visibility; local-only accounts deliberately have no remote toggle. */
export function useAccountPrivacy(account: LedgerAccount | undefined, householdId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isPrivate: boolean) => {
      if (!account || !householdId) {
        throw new Error("This account is not available in the active household.");
      }
      const result = await orpc.commands.apply({
        commandId: generateId(),
        householdId,
        kind: "account.update",
        payload: {
          accountId: account.id,
          visibility: isPrivate ? "private" : "public",
        },
        preconditions: [{ entityId: account.id, expectedVersion: account.version }],
      });
      if (result.kind !== "applied") {
        throw new Error("Could not update account privacy. Please try again.");
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ledger", "accounts", householdId] }),
        queryClient.invalidateQueries({ queryKey: ["ledger", "transactions", householdId] }),
      ]);
    },
  });
}
