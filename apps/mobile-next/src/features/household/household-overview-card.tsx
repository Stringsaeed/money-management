import { StyleSheet } from "react-native";
import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { Button, Card, space, Text } from "@/ui/trove";

import type { HouseholdDetail } from "./household-client";

interface HouseholdOverviewCardProps {
  readonly household: HouseholdDetail;
  readonly activeMemberCount: number;
  readonly scope: V2LedgerScope;
  readonly busy: boolean;
  readonly onSelectScope: (scope: V2LedgerScope) => void;
}

export function HouseholdOverviewCard({
  household,
  activeMemberCount,
  scope,
  busy,
  onSelectScope,
}: HouseholdOverviewCardProps) {
  return (
    <Card style={styles.card}>
      <Text variant="titleSm">{household.name}</Text>
      <Text tone="secondary" variant="bodySm">
        {activeMemberCount} active member(s)
      </Text>
      {scope.kind === "personal" ? (
        <Button
          fullWidth
          label="Use household ledger"
          loading={busy}
          onPress={() => onSelectScope({ kind: "household", householdId: household.householdId })}
        />
      ) : (
        <Button
          fullWidth
          label="Use personal ledger"
          loading={busy}
          onPress={() => onSelectScope({ kind: "personal" })}
          variant="secondary"
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({ card: { gap: space[3] } });
