import { StyleSheet, View } from "react-native";

import { OptionTile } from "@/features/ledger/editor/option-tile";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";
import { spacing } from "@/ui/design-tokens";

export type CreateAction = "transaction" | "account" | "category";

interface CreateActionSheetProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly onSelect: (action: CreateAction) => void;
}

const ACTIONS: readonly { action: CreateAction; emoji: string; label: string }[] = [
  { action: "transaction", emoji: "🧾", label: "Transaction" },
  { action: "account", emoji: "🏦", label: "Account" },
  { action: "category", emoji: "🏷️", label: "Category" },
];

export function CreateActionSheet({ open, onDismiss, onSelect }: CreateActionSheetProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} testID="create-action-sheet">
      <Text variant="title">✨ Create</Text>
      <View style={styles.actions}>
        {ACTIONS.map(({ action, emoji, label }) => (
          <OptionTile
            key={action}
            emoji={emoji}
            label={label}
            selected
            onPress={() => onSelect(action)}
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ actions: { flexDirection: "row", gap: spacing[2] } });
