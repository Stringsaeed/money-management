import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { coreFromAccess, selectLedgerSourceForAccess, useAccess } from "@/modules/access";
import { useSyncModeStore } from "@/stores/sync-mode-store";

import { LedgerDataSourceProvider } from "./provider";

export function LedgerDataSourceGate({ children }: { readonly children: ReactNode }) {
  const access = useAccess();
  const migration = useMigratedHouseholdId();
  const mode = useSyncModeStore((state) => state.mode);
  const reason = useSyncModeStore((state) => state.reason);

  if (access.kind === "resolving" || migration.isPending) {
    return (
      <View className="safe-top safe-bottom flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LedgerDataSourceProvider
      selection={selectLedgerSourceForAccess(
        coreFromAccess(access),
        migration.data ?? null,
        mode,
        reason,
      )}
    >
      {children}
    </LedgerDataSourceProvider>
  );
}
