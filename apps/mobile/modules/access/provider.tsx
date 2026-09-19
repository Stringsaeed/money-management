import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import { orpc } from "@/lib/server/orpc";
import { cohereLedgerCache } from "@/modules/ledger-cache";

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
import { readClaim, writeClaim } from "./claim-store";
import { HOUSEHOLDS_KEY } from "./households-key";
import { readLedgerSelection, writeLedgerSelection } from "./ledger-selection-store";
import { toMembershipSummary } from "./memberships";
import { runSignedOutSessionCleanup } from "./sign-out-session";
import { useSessionProbe } from "./session-probe";
import type { AccessCore, HouseholdRead, IdentityClaim, LedgerSelection, ReturnTo } from "./types";
import { AuthSheetContext } from "./use-auth-sheet";
import { AccessContext } from "./use-access";

const PERSONAL: LedgerSelection = { kind: "personal" };

export function AccessProvider({ children }: { readonly children: ReactNode }) {
  const db = useDatabase();
  const queryClient = useQueryClient();
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
    db,
    queryClient,
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

  useRevocationEffect(core, selection, queryClient);

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
    if (!userId) {
      setValue(PERSONAL);
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

/**
 * Detects revoked membership and resets selection to Personal.
 *
 * When `resolveAccess` normalizes a household selection to Personal (because
 * the membership no longer exists), this effect persists that reset and
 * invalidates ledger caches so stale household data isn't shown.
 *
 * Fail-closed: revoked membership → Personal + cache clear.
 * Offline: last authorized cache is kept until reconnect proves removal.
 */
function useRevocationEffect(
  core: AccessCore,
  selection: { value: LedgerSelection; setValue: (next: LedgerSelection) => void },
  queryClient: ReturnType<typeof useQueryClient>,
) {
  useEffect(() => {
    if (core.kind !== "signed_in") return;
    const wasHousehold = selection.value.kind === "household";
    const nowPersonal = core.selection.kind === "personal";
    if (!wasHousehold || !nowPersonal) return;
    selection.setValue(PERSONAL);
    void writeLedgerSelection(core.user.userId, PERSONAL);
    void cohereLedgerCache(queryClient, { kind: "ledger.reset" });
  }, [core, selection, queryClient]);
}

function useAccessActions(
  db: ReturnType<typeof useDatabase>,
  queryClient: ReturnType<typeof useQueryClient>,
  setClaim: (claim: IdentityClaim) => void,
  setSignedOut: (value: boolean) => void,
  core: AccessCore,
  setSheetSession: (session: AuthSheetSession) => void,
  setSelection: (selection: LedgerSelection) => void,
) {
  function presentAuthSheet(input: PresentAuthSheetInput) {
    setSheetSession(openAuthSheetSession(input));
  }

  function beginAuth(target: ReturnTo) {
    if (!canPresentAuthSheet(core)) return;
    presentAuthSheet({ target });
  }

  async function signOut() {
    const userId = core.kind === "signed_in" ? core.user.userId : null;
    setSignedOut(true);
    setSelection(PERSONAL);
    setClaim({ kind: "none" });
    await runSignedOutSessionCleanup({ db, queryClient, userId });
  }

  async function setActiveHousehold(householdId: string | null) {
    if (core.kind !== "signed_in") return;
    const next: LedgerSelection =
      householdId === null ? PERSONAL : { kind: "household", householdId };
    if (next.kind === "household") {
      const allowed = core.memberships.some((row) => row.householdId === next.householdId);
      if (!allowed) return;
    }
    const changed =
      core.selection.kind !== next.kind ||
      (next.kind === "household" &&
        core.selection.kind === "household" &&
        next.householdId !== core.selection.householdId);
    setSelection(next);
    await writeLedgerSelection(core.user.userId, next);
    if (changed) {
      await cohereLedgerCache(queryClient, { kind: "ledger.reset" });
    }
    await queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
  }

  function retryHouseholds() {
    void queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
  }

  return { beginAuth, presentAuthSheet, signOut, setActiveHousehold, retryHouseholds };
}
