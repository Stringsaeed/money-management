import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";

import type { HouseholdRole } from "@trove/protocol";

import { orpc } from "@/lib/server/orpc";
import {
  HOUSEHOLDS_KEY,
  householdsQueryKeyForUser,
  signedInUserId,
  useAccess,
} from "@/modules/access";
import { buildWidgetPageUrl } from "@/utils/widget-handoff";

export type HouseholdSummary = Awaited<ReturnType<typeof orpc.households.listMine>>[number];
export interface CreateHouseholdInput {
  readonly name: string;
  readonly requestId: string;
}

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

export function useHouseholds() {
  const access = useAccess();
  const userId = signedInUserId(access);
  return useQuery({
    queryKey: householdsQueryKeyForUser(userId),
    queryFn: () => orpc.households.listMine(),
    enabled: userId !== null,
  });
}

export function useActiveHousehold() {
  const access = useAccess();
  const { data: households, ...rest } = useHouseholds();
  const activeHouseholdId =
    access.kind === "signed_in" && access.household.kind === "active"
      ? access.household.householdId
      : null;
  const active =
    activeHouseholdId === null
      ? null
      : (households?.find((row) => row.householdId === activeHouseholdId) ?? null);
  return { activeHousehold: active, households: households ?? [], ...rest };
}

export function useHouseholdDetail(householdId: string | null) {
  const userId = signedInUserId(useAccess());
  return useQuery({
    queryKey: ["household", userId, householdId],
    queryFn: () => orpc.households.get({ householdId: householdId! }),
    enabled: Boolean(userId && householdId),
  });
}

function useInvalidateHouseholds() {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: HOUSEHOLDS_KEY }),
      qc.invalidateQueries({ queryKey: ["household"] }),
      qc.invalidateQueries({ queryKey: ["migration"] }),
    ]);
  };
}

export function useCreateHousehold() {
  const access = useAccess();
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (input: CreateHouseholdInput) => orpc.households.create(input),
    onSuccess: async (created) => {
      await invalidate();
      if (access.kind === "signed_in") {
        await access.selectLedger(created.householdId);
      }
    },
  });
}

export function useInviteMember() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (input: {
      readonly householdId: string;
      readonly email: string;
      readonly role: HouseholdRole;
    }) => orpc.households.invite(input),
    onSuccess: invalidate,
  });
}

export function useSetMemberRole() {
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (input: {
      readonly householdId: string;
      readonly targetUserId: string;
      readonly role: HouseholdRole;
    }) => orpc.households.setMemberRole(input),
    onSuccess: invalidate,
  });
}

export function useRemoveMember() {
  const access = useAccess();
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: (input: { readonly householdId: string; readonly targetUserId: string }) =>
      orpc.households.removeMember(input),
    onSuccess: async (_result, input) => {
      if (
        access.kind === "signed_in" &&
        access.user.userId === input.targetUserId &&
        access.selection.kind === "household" &&
        access.selection.householdId === input.householdId
      ) {
        await access.selectLedger(null);
      }
      await invalidate();
    },
  });
}

export function useLeaveHousehold() {
  const access = useAccess();
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: async (householdId: string) => {
      await orpc.households.leave({ householdId });
      if (
        access.kind === "signed_in" &&
        access.selection.kind === "household" &&
        access.selection.householdId === householdId
      ) {
        await access.selectLedger(null);
      }
    },
    onSuccess: invalidate,
  });
}

export function useDeleteHousehold() {
  const access = useAccess();
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: async (householdId: string) => {
      await orpc.households.delete({ householdId });
      if (
        access.kind === "signed_in" &&
        access.selection.kind === "household" &&
        access.selection.householdId === householdId
      ) {
        await access.selectLedger(null);
      }
    },
    onSuccess: invalidate,
  });
}

/** Opens the admin-only WorkOS member-management page with a one-time handoff code. */
export function useOpenMemberWidget() {
  return useMutation({
    mutationFn: async (householdId: string) => {
      const handoff = await orpc.households.widgetHandoff({ householdId });
      const url = buildWidgetPageUrl(serverUrl, handoff.code);
      await WebBrowser.openBrowserAsync(url);
      return handoff;
    },
  });
}
