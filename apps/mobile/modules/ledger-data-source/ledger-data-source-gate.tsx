import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { useActiveHousehold } from "@/hooks/use-households";
import { authClient } from "@/lib/auth-client";
import { useSyncModeStore } from "@/stores/sync-mode-store";

import {
  LedgerDataSourceProvider,
  selectLedgerSource,
  type LedgerSourceSelection,
} from "./provider";

type LedgerGateState = "loading" | "failure" | "local" | "ready";

interface LedgerGateFacts {
  readonly sessionPending: boolean;
  readonly authenticated: boolean;
  readonly householdsPending: boolean;
  readonly householdsFailed: boolean;
  readonly migrationPending: boolean;
  readonly hasMigratedHousehold: boolean;
  readonly migrationFailed: boolean;
}

export function LedgerDataSourceGate({ children }: { readonly children: ReactNode }) {
  const session = authClient.useSession();
  const households = useActiveHousehold();
  const migration = useMigratedHouseholdId();
  const mode = useSyncModeStore((state) => state.mode);
  const reason = useSyncModeStore((state) => state.reason);
  const gateState = resolveLedgerGateState({
    sessionPending: session.isPending,
    authenticated: Boolean(session.data),
    householdsPending: households.isPending,
    householdsFailed: households.isError,
    migrationPending: migration.isPending,
    migrationFailed: migration.isError,
    hasMigratedHousehold: Boolean(migration.data),
  });

  if (gateState === "loading") {
    return (
      <View className="safe-top safe-bottom flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (gateState === "failure") {
    return (
      <View className="safe-top safe-bottom flex-1 items-center justify-center px-6">
        <Text className="text-center font-body-medium text-sm text-ink">
          The authorized ledger could not load. Check your connection and try again.
        </Text>
      </View>
    );
  }
  if (gateState === "local") {
    return (
      <LedgerDataSourceProvider selection={{ kind: "local" }}>{children}</LedgerDataSourceProvider>
    );
  }

  const selection = selectReadyLedgerSource(
    session.data?.user.id,
    households.activeHousehold?.householdId,
    migration.data,
    mode,
    reason,
    households.isError,
  );

  return <LedgerDataSourceProvider selection={selection}>{children}</LedgerDataSourceProvider>;
}

function selectReadyLedgerSource(
  userId: string | undefined,
  activeHouseholdId: string | undefined,
  migratedHouseholdId: string | null | undefined,
  mode: "synced" | "local_only",
  reason: string | null,
  householdsFailed: boolean,
): LedgerSourceSelection {
  return selectLedgerSource({
    authenticatedUserId: userId ?? null,
    activeHouseholdId: activeHouseholdId ?? migratedHouseholdId ?? null,
    migratedHouseholdId: migratedHouseholdId ?? null,
    offlineReason:
      mode === "local_only"
        ? (reason ?? "Sync is temporarily unavailable.")
        : householdsFailed
          ? "Household sync is temporarily unavailable."
          : null,
  });
}

function resolveLedgerGateState(facts: LedgerGateFacts): LedgerGateState {
  if (facts.sessionPending) return "loading";
  // Anonymous / signed-out users stay on the local ledger even when the auth
  // session probe errors (server down, SecureStore hiccup). Blocking here would
  // strand local-first use behind household infrastructure.
  if (!facts.authenticated) return "local";
  if (facts.householdsPending) return "loading";
  if (facts.migrationPending) return "loading";
  if (facts.householdsFailed && !facts.hasMigratedHousehold) return "failure";
  if (facts.migrationFailed) return "failure";
  return "ready";
}
