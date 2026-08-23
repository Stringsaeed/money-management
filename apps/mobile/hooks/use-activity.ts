import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";

export type ActivityEntry = Awaited<ReturnType<typeof orpc.activity.list>>["changes"][number];
export type ActivityPage = Awaited<ReturnType<typeof orpc.activity.list>>;

/** Timeline filters the screen controls; all optional. */
export interface ActivityFilters {
  /** Restrict to one member's changes. */
  readonly userId?: string;
  /** Inclusive range start, "YYYY-MM-DD". */
  readonly fromDate?: string;
  /** Inclusive range end, "YYYY-MM-DD". */
  readonly toDate?: string;
}

/**
 * Household activity timeline reads (#95). Server-decoded entries arrive
 * newest-first with user attribution and a human-readable action summary.
 * Pagination is offset-based; pass a larger `limit` for "load more".
 */
export function useActivity(householdId: string | null, filters: ActivityFilters = {}, limit = 50) {
  const { userId, fromDate, toDate } = filters;
  return useQuery({
    queryKey: [
      "activity",
      "list",
      householdId,
      userId ?? null,
      fromDate ?? null,
      toDate ?? null,
      limit,
    ],
    queryFn: () =>
      orpc.activity.list({
        householdId: householdId!,
        limit,
        ...(userId && { userId }),
        ...(fromDate && { from: fromDate }),
        ...(toDate && { to: toDate }),
      }),
    enabled: Boolean(householdId),
  });
}
