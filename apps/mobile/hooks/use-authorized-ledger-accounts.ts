import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";

export type AuthorizedLedgerAccount = Awaited<ReturnType<typeof orpc.ledger.accounts.list>>[number];

/** Server-authorized Account visibility used only to filter retained local rows. */
export const useAuthorizedLedgerAccounts = (householdId: string | null) =>
  useQuery({
    queryKey: ["ledger-authorization", "accounts", householdId],
    queryFn: () => orpc.ledger.accounts.list({ householdId: householdId! }),
    enabled: Boolean(householdId),
  });
