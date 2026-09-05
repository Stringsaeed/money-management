import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { coreFromAccess, selectLedgerSourceForAccess, useAccess } from "@/modules/access";
import { useSyncModeStore } from "@/stores/sync-mode-store";

import { SyncedTransactionsProvider } from "@/modules/ledger-db/provider";

import { LedgerDataSourceProvider } from "./provider";

export function LedgerDataSourceGate({ children }: { readonly children: ReactNode }) {
  const access = useAccess();
  const migration = useMigratedHouseholdId();
  const mode = useSyncModeStore((state) => state.mode);
  const reason = useSyncModeStore((state) => state.reason);

  // Only block the first migration read. Access "resolving" (session/households
  // pending) must not unmount the tree — that remounts onboarding at welcome
  // and looks like a loop when the session probe flaps.
  if (migration.isPending) {
    return (
      <View className="safe-top safe-bottom flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const selection = selectLedgerSourceForAccess(
    coreFromAccess(access),
    migration.data ?? null,
    mode,
    reason,
  );

  return (
    <LedgerDataSourceProvider selection={selection}>
      {selection.kind === "synced" ? (
        <SyncedTransactionsProvider householdId={selection.householdId} userId={selection.userId}>
          {children}
        </SyncedTransactionsProvider>
      ) : (
        children
      )}
    </LedgerDataSourceProvider>
  );
}
