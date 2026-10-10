import { View } from "react-native";
import type { V2LedgerScope } from "@trove/api/v2/contracts";

import type { HouseholdDetail } from "@/features/household/household-client";
import {
  Banner,
  colors,
  Icon,
  ListGroup,
  ListRow,
  radius,
  Sheet,
  Skeleton,
  space,
} from "@/ui/trove";

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

const SelectedMark = () => <Icon color={colors.accent.text} name="check" size={20} />;

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
    <Sheet open={open} onDismiss={onDismiss} testID="ledger-scope-sheet" title="Choose ledger">
      <ListGroup>
        <ListRow
          icon="scope-personal"
          onPress={() => onSelect({ kind: "personal" })}
          title="Personal"
          trailing={scope.kind === "personal" ? <SelectedMark /> : undefined}
        />
        {household ? (
          <ListRow
            icon="scope-household"
            onPress={() => onSelect({ kind: "household", householdId: household.householdId })}
            title={household.name}
            trailing={scope.kind === "household" ? <SelectedMark /> : undefined}
          />
        ) : null}
      </ListGroup>
      {loading ? (
        <View accessible accessibilityLabel="Loading household" accessibilityState={{ busy: true }}>
          <Skeleton borderRadius={radius.lg} height={space[12]} />
        </View>
      ) : null}
      {!loading && !household ? (
        <Banner
          actionLabel="Open household"
          message={error ?? "Create or join a household to share a ledger."}
          onAction={onOpenHousehold}
          tone={error ? "negative" : "neutral"}
        />
      ) : null}
    </Sheet>
  );
}
