import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";

import { resolveAccess, nextClaim } from "./access";
import { attachCapabilities } from "./capabilities";
import { clearClaim, readClaim, writeClaim } from "./claim-store";
import { HOUSEHOLDS_KEY } from "./households-key";
import { toMembershipSummary } from "./memberships";
import { serializeReturnTo } from "./return-to";
import { endRemoteSession, useSessionProbe } from "./session-probe";
import type { HouseholdRead, IdentityClaim, ReturnTo } from "./types";
import { AccessContext } from "./use-access";

export function AccessProvider({ children }: { readonly children: ReactNode }) {
  const claim = useIdentityClaim();
  const probe = useSessionProbe();
  const [signedOut, setSignedOut] = useState(false);
  const households = useHouseholdRead(probe?.kind === "session" && !signedOut);
  const persistClaim = usePersistedClaim(claim.value, signedOut ? { kind: "no_session" } : probe);
  const access = attachCapabilities(
    resolveAccess({
      claim: signedOut ? { kind: "none" } : (persistClaim ?? { kind: "none" }),
      probe: claim.ready ? (signedOut ? { kind: "no_session" } : probe) : null,
      households,
    }),
    useAccessActions(claim.setValue, setSignedOut),
  );

  useEffect(() => {
    if (probe?.kind === "no_session") setSignedOut(false);
  }, [probe]);

  return <AccessContext value={access}>{children}</AccessContext>;
}

function useIdentityClaim() {
  const [value, setValue] = useState<IdentityClaim | null>(null);

  useEffect(() => {
    let cancelled = false;
    void readClaim().then((next) => {
      if (!cancelled) setValue(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { value, setValue, ready: value !== null };
}

function usePersistedClaim(
  claim: IdentityClaim | null,
  probe: ReturnType<typeof useSessionProbe>,
): IdentityClaim | null {
  const [held, setHeld] = useState(claim);

  useEffect(() => {
    setHeld(claim);
  }, [claim]);

  useEffect(() => {
    if (claim == null || probe == null) return;
    const next = nextClaim(claim, probe, new Date());
    if (next === claim) return;
    void writeClaim(next).then(() => setHeld(next));
  }, [claim, probe]);

  return held ?? claim;
}

function useHouseholdRead(enabled: boolean): HouseholdRead {
  const query = useQuery({
    queryKey: HOUSEHOLDS_KEY,
    queryFn: () => orpc.households.listMine(),
    enabled,
  });
  if (!enabled) return { kind: "loaded", memberships: [] };
  if (query.isPending) return { kind: "pending" };
  if (query.isError) return { kind: "failed" };
  return {
    kind: "loaded",
    memberships: (query.data ?? []).map(toMembershipSummary),
  };
}

function useAccessActions(
  setClaim: (claim: IdentityClaim) => void,
  setSignedOut: (value: boolean) => void,
) {
  const queryClient = useQueryClient();

  function beginAuth(target: ReturnTo) {
    router.push({
      pathname: "/(auth)/sign-in",
      params: { returnTo: serializeReturnTo(target) },
    });
  }

  async function signOut() {
    setSignedOut(true);
    await endRemoteSession();
    await clearClaim();
    setClaim({ kind: "none" });
  }

  async function setActiveHousehold(householdId: string) {
    await orpc.households.setActive({ householdId });
    await queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
  }

  function retryHouseholds() {
    void queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
  }

  return { beginAuth, signOut, setActiveHousehold, retryHouseholds };
}
