import { useEffect, useState } from "react";

import { householdClient, type HouseholdDetail } from "./household-client";

export interface HouseholdState {
  readonly household: HouseholdDetail | null;
  readonly loading: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly create: (name: string) => Promise<void>;
  readonly invite: (email: string) => Promise<void>;
  readonly makeAdmin: (userId: string) => Promise<void>;
  readonly leave: () => Promise<void>;
}

export function useHousehold(enabled: boolean): HouseholdState {
  const [household, setHousehold] = useState<HouseholdDetail | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setHousehold(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void householdClient
      .list()
      .then(async (summaries) => {
        const first = summaries[0];
        return first ? householdClient.get(first.householdId) : null;
      })
      .then((next) => {
        if (!cancelled) setHousehold(next);
      })
      .catch((caught) => {
        if (!cancelled)
          setError(caught instanceof Error ? caught.message : "Could not load the household.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const runMutation = async (action: () => Promise<void>, successNotice?: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (successNotice) setNotice(successNotice);
      refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The household action failed.");
    } finally {
      setBusy(false);
    }
  };

  return {
    household,
    loading,
    busy,
    error,
    notice,
    create: (name) =>
      runMutation(async () => {
        const created = await householdClient.create(name.trim());
        setHousehold(await householdClient.get(created.householdId));
      }, "Household created."),
    invite: (email) =>
      runMutation(
        () =>
          householdClient.invite(household?.householdId ?? "", email.trim()).then(() => undefined),
        "Invitation sent. Accept the WorkOS email, then sign in to Trove Next.",
      ),
    makeAdmin: (userId) =>
      runMutation(
        () => householdClient.setMemberRole(household?.householdId ?? "", userId, "admin"),
        "Member promoted to admin.",
      ),
    leave: () =>
      runMutation(async () => {
        if (!household) return;
        await householdClient.leave(household.householdId);
        setHousehold(null);
      }, "You left the household."),
  };
}
