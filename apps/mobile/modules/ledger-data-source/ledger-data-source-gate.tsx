import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSyncEnrollment } from "@/hooks/use-enable-sync";
import {
  coreFromAccess,
  NO_SYNC_ENROLLMENT,
  selectLedgerSourceForAccess,
  useAccess,
} from "@/modules/access";
import { useSyncModeStore } from "@/stores/sync-mode-store";

import { SyncedTransactionsProvider } from "@/modules/ledger-db/provider";

import { LedgerDataSourceProvider } from "./provider";

export function LedgerDataSourceGate({ children }: { readonly children: ReactNode }) {
  const access = useAccess();
  const enrollment = useSyncEnrollment();
  const mode = useSyncModeStore((state) => state.mode);
  const reason = useSyncModeStore((state) => state.reason);
  const insets = useSafeAreaInsets();

  // Only block the first migration read. Access "resolving" (session/households
  // pending) must not unmount the tree — that remounts onboarding at welcome
  // and looks like a loop when the session probe flaps.
  if (enrollment.isPending) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const selection = selectLedgerSourceForAccess(
    coreFromAccess(access),
    enrollment.data ?? NO_SYNC_ENROLLMENT,
    mode,
    reason,
  );

  return (
    <LedgerDataSourceProvider selection={selection}>
      {selection.kind === "synced" ? (
        <SyncedTransactionsProvider binding={selection.ledger} userId={selection.userId}>
          {children}
        </SyncedTransactionsProvider>
      ) : (
        children
      )}
    </LedgerDataSourceProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
