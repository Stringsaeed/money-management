import { StyleSheet, View } from "react-native";
import type { V2LedgerScope } from "@trove/api/v2/contracts";

import type { HouseholdDetail } from "@/features/household/household-client";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";

interface ScopeSheetProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly scope: V2LedgerScope;
  readonly household: HouseholdDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onSelect: (scope: V2LedgerScope) => void;
  readonly onOpenHousehold: () => void;
}

export function ScopeSheet({
  open,
  onDismiss,
  scope,
  household,
  loading,
  error,
  onSelect,
  onOpenHousehold,
}: ScopeSheetProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} testID="ledger-scope-sheet">
      <Text variant="title">Choose ledger</Text>
      <View style={styles.options}>
        <Button
          title="Personal"
          variant={scope.kind === "personal" ? "primary" : "secondary"}
          onPress={() => onSelect({ kind: "personal" })}
        />
        {loading ? <Text style={styles.muted}>Loading household…</Text> : null}
        {household ? (
          <Button
            title={household.name}
            variant={scope.kind === "household" ? "primary" : "secondary"}
            onPress={() => onSelect({ kind: "household", householdId: household.householdId })}
          />
        ) : null}
        {!loading && !household ? (
          <>
            <Text style={styles.muted}>
              {error ?? "Create or join a household to share a ledger."}
            </Text>
            <Button title="Open household" variant="ghost" onPress={onOpenHousehold} />
          </>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing[2] },
  muted: { color: colors.mutedForeground },
});
