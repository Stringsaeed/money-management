import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/server/orpc";

import {
  householdReadFromQuery,
  householdUserIdForQuery,
  householdsQueryKeyForUser,
  nextClaim,
  resolveAccess,
} from "./access";
import { AuthSheetHost } from "./auth-sheet-host";
import {
  AUTH_SHEET_CLOSED,
  canPresentAuthSheet,
  openAuthSheetSession,
  type AuthSheetSession,
  type PresentAuthSheetInput,
} from "./auth-sheet-session";
import { attachCapabilities } from "./capabilities";
import { clearClaim, readClaim, writeClaim } from "./claim-store";
import { HOUSEHOLDS_KEY } from "./households-key";
import {
  clearLedgerSelection,
  readLedgerSelection,
  writeLedgerSelection,
} from "./ledger-selection-store";
import { toMembershipSummary } from "./memberships";
import { tryRemoteSignOut, useSessionProbe } from "./session-probe";
import type { AccessCore, HouseholdRead, IdentityClaim, LedgerSelection, ReturnTo } from "./types";
import { AuthSheetContext } from "./use-auth-sheet";
import { AccessContext } from "./use-access";

const PERSONAL: LedgerSelection = { kind: "personal" };

export function AccessProvider({ children }: { readonly children: ReactNode }) {
  const claim = useIdentityClaim();
  const probe = useSessionProbe();
  const [signedOut, setSignedOut] = useState(false);
  const [sheetSession, setSheetSession] = useState<AuthSheetSession>(AUTH_SHEET_CLOSED);
  const persistClaim = usePersistedClaim(claim.value, signedOut ? { kind: "no_session" } : probe);
  const householdUserId = householdUserIdForQuery(persistClaim, probe, signedOut);
  const selection = useLedgerSelection(householdUserId);
  const households = useHouseholdRead(householdUserId, probe?.kind === "session" && !signedOut);
  const core = resolveAccess({
    claim: signedOut ? { kind: "none" } : (persistClaim ?? { kind: "none" }),
    probe: claim.ready ? (signedOut ? { kind: "no_session" } : probe) : null,
    households,
    selection: selection.value,
  });
  const actions = useAccessActions(
    claim.setValue,
    setSignedOut,
    core,
    setSheetSession,
    selection.setValue,
  );
  const access = attachCapabilities(core, actions);

  useEffect(() => {
    if (probe?.kind === "no_session") setSignedOut(false);
  }, [probe]);

  return (
    <AccessContext value={access}>
      <AuthSheetContext value={{ presentAuthSheet: actions.presentAuthSheet }}>
        {children}
        <AuthSheetHost
          session={sheetSession}
          onDismiss={() => setSheetSession(AUTH_SHEET_CLOSED)}
        />
      </AuthSheetContext>
    </AccessContext>
  );
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

function useLedgerSelection(userId: string | null) {
  const [value, setValue] = useState<LedgerSelection>(PERSONAL);

  useEffect(() => {
    let cancelled = false;
    setValue(PERSONAL);
    if (!userId) {
      return;
    }
    void readLedgerSelection(userId).then((next) => {
      if (!cancelled) setValue(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { value, setValue };
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

function useHouseholdRead(userId: string | null, enabled: boolean): HouseholdRead {
  const query = useQuery({
    queryKey: householdsQueryKeyForUser(userId),
    queryFn: () => orpc.households.listMine(),
    enabled,
  });
  const memberships = query.data
    ?.map(toMembershipSummary)
    .filter((row): row is NonNullable<typeof row> => row !== null);
  return householdReadFromQuery({
    enabled,
    isPending: query.isPending,
    isError: query.isError,
    memberships,
  });
}

function useAccessActions(
  setClaim: (claim: IdentityClaim) => void,
  setSignedOut: (value: boolean) => void,
  core: AccessCore,
  setSheetSession: (session: AuthSheetSession) => void,
  setSelection: (selection: LedgerSelection) => void,
) {
  const queryClient = useQueryClient();

  function presentAuthSheet(input: PresentAuthSheetInput) {
    setSheetSession(openAuthSheetSession(input));
  }

  function beginAuth(target: ReturnTo) {
    if (!canPresentAuthSheet(core)) return;
    presentAuthSheet({ target });
  }

  async function signOut() {
    const userId =
      core.kind === "signed_in"
        ? core.user.userId
        : core.kind === "session_revoked"
          ? core.lastKnown.userId
          : null;
    setSignedOut(true);
    await tryRemoteSignOut();
    if (userId) await clearLedgerSelection(userId);
    setSelection(PERSONAL);
    await clearClaim();
    setClaim({ kind: "none" });
  }

  async function selectLedger(householdId: string | null) {
    if (core.kind !== "signed_in") return;
    const next: LedgerSelection =
      householdId === null ? PERSONAL : { kind: "household", householdId };
    if (next.kind === "household") {
      let allowed = core.memberships.some((row) => row.householdId === next.householdId);
      if (!allowed) {
        const latest = await queryClient.fetchQuery({
          queryKey: householdsQueryKeyForUser(core.user.userId),
          queryFn: () => orpc.households.listMine(),
        });
        allowed = latest
          .map(toMembershipSummary)
          .some((row) => row?.householdId === next.householdId);
      }
      if (!allowed) {
        throw new Error("That Household is no longer available to this User.");
      }
    }
    setSelection(next);
    await writeLedgerSelection(core.user.userId, next);
  }

  function retryHouseholds() {
    void queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
  }

  return { beginAuth, presentAuthSheet, signOut, selectLedger, retryHouseholds };
}
