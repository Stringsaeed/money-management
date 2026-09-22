import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";
import { spacing } from "@/ui/design-tokens";

export type CreateAction = "transaction" | "account" | "category";

interface CreateActionSheetProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly onSelect: (action: CreateAction) => void;
}

const ACTIONS: readonly { action: CreateAction; label: string }[] = [
  { action: "transaction", label: "Transaction" },
  { action: "account", label: "Account" },
  { action: "category", label: "Category" },
];

export function CreateActionSheet({ open, onDismiss, onSelect }: CreateActionSheetProps) {
  return (
    <Sheet open={open} onDismiss={onDismiss} testID="create-action-sheet">
      <Text variant="title">Create</Text>
      <View style={styles.actions}>
        {ACTIONS.map(({ action, label }) => (
          <Button key={action} title={label} onPress={() => onSelect(action)} />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ actions: { gap: spacing[2] } });
