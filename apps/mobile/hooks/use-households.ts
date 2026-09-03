import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";
import { HOUSEHOLDS_KEY, useAccess } from "@/modules/access";

export type HouseholdSummary = Awaited<ReturnType<typeof orpc.households.listMine>>[number];

export function useHouseholds() {
  const access = useAccess();
  return useQuery({
    queryKey: HOUSEHOLDS_KEY,
    queryFn: () => orpc.households.listMine(),
    enabled: access.kind === "signed_in",
  });
}

export function useActiveHousehold() {
  const { data: households, ...rest } = useHouseholds();
  const active = households?.find((h) => h.isActive) ?? null;
  return { activeHousehold: active, households: households ?? [], ...rest };
}

export function useHouseholdDetail(householdId: string | null) {
  return useQuery({
    queryKey: ["household", householdId],
    queryFn: () => orpc.households.get({ householdId: householdId! }),
    enabled: Boolean(householdId),
  });
}

function useInvalidateHouseholds() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
    void qc.invalidateQueries({ queryKey: ["household"] });
  };
}

export function useCreateHousehold() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (name: string) => orpc.households.create({ name }),
    onSuccess: invalidate,
  });
}

export function useGenerateInvite() {
  return useMutation({
    mutationFn: (input: { householdId: string; singleUse?: boolean; expiresInDays?: number }) =>
      orpc.households.generateInvite({
        householdId: input.householdId,
        singleUse: input.singleUse ?? true,
      }),
  });
}

export function useAcceptInvite() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (code: string) => orpc.households.acceptInvite({ code }),
    onSuccess: invalidate,
  });
}

export function useLeaveHousehold() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (householdId: string) => orpc.households.leave({ householdId }),
    onSuccess: invalidate,
  });
}

export function useDeleteHousehold() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (householdId: string) => orpc.households.delete({ householdId }),
    onSuccess: invalidate,
  });
}

export function useTransferOwnership() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (input: { householdId: string; userId: string }) =>
      orpc.households.transferOwnership(input),
    onSuccess: invalidate,
  });
}
export function useSetActiveHousehold() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (householdId: string) => orpc.households.setActive({ householdId }),
    onSuccess: invalidate,
  });
}
