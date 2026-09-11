import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";

import { orpc } from "@/lib/server/orpc";
import { HOUSEHOLDS_KEY, useAccess } from "@/modules/access";
import { generateId } from "@/utils/id";
import { buildWidgetPageUrl } from "@/utils/widget-handoff";

export type HouseholdSummary = Awaited<ReturnType<typeof orpc.households.listMine>>[number];

const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

export function useHouseholds() {
  const access = useAccess();
  return useQuery({
    queryKey: HOUSEHOLDS_KEY,
    queryFn: () => orpc.households.listMine(),
    enabled: access.kind === "signed_in",
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
    void qc.invalidateQueries({ queryKey: ["migration"] });
  };
}

export function useCreateHousehold() {
  const access = useAccess();
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: async (name: string) => {
      const created = await orpc.households.create({ name, requestId: generateId() });
      if (access.kind === "signed_in") {
        await access.setActiveHousehold(created.householdId);
      }
      return created;
    },
    onSuccess: invalidate,
  });
}

export function useLeaveHousehold() {
  const access = useAccess();
  const invalidate = useInvalidateHouseholds();
  return useMutation({
    mutationFn: async (householdId: string) => {
      await orpc.households.leave({ householdId });
      if (access.kind === "signed_in") {
        await access.setActiveHousehold(null);
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
      if (access.kind === "signed_in") {
        await access.setActiveHousehold(null);
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
