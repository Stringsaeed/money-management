import { useQuery } from "@tanstack/react-query";

import { householdClient, type HouseholdDetail } from "./household-client";

export const householdMembershipKey = (householdId: string) =>
  ["household", "membership", householdId] as const;

export interface HouseholdMembership {
  /** The household, or null once the caller is no longer an active member of it. */
  readonly household: HouseholdDetail | null;
  /** True once the server has answered; `household` is only trustworthy after that. */
  readonly known: boolean;
}

/**
 * The caller's membership in `householdId`, read from the household list, so a revoked or left
 * household reads as `null`. Idle (and `known: false`) when `householdId` is null.
 */
export function useHouseholdMembership(householdId: string | null): HouseholdMembership {
  const query = useQuery({
    queryKey: householdMembershipKey(householdId ?? "none"),
    queryFn: async (): Promise<HouseholdDetail | null> => {
      const summaries = await householdClient.list();
      const match = summaries.find((summary) => summary.householdId === householdId);
      return match ? householdClient.get(match.householdId) : null;
    },
    enabled: householdId !== null,
    staleTime: 15_000,
    retry: 1,
  });
  return { household: query.data ?? null, known: query.data !== undefined };
}
