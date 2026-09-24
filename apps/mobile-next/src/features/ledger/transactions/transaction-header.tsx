import { StyleSheet, View } from "react-native";

import { spacing } from "@/ui/design-tokens";
import { IconButton } from "@/ui/icon-button";
import { Text } from "@/ui/text";

interface TransactionHeaderProps {
  readonly title: string;
  readonly busy: boolean;
  readonly onCancel?: () => void;
  readonly onDelete?: () => void;
  readonly onSave: () => void;
}

export function TransactionHeader({
  title,
  busy,
  onCancel,
  onDelete,
  onSave,
}: TransactionHeaderProps) {
  return (
    <View style={styles.header}>
      <Text variant="headline" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {onDelete ? (
        <IconButton
          name="trash"
          accessibilityLabel="Delete transaction"
          disabled={busy}
          onPress={onDelete}
        />
      ) : null}
      {onCancel ? <IconButton name="x" accessibilityLabel="Close" onPress={onCancel} /> : null}
      <IconButton
        name="check"
        accessibilityLabel="Save"
        variant="primary"
        disabled={busy}
        onPress={onSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  title: { flex: 1 },
});
