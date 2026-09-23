import type { V2Category } from "@trove/api/v2/contracts";
import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { spacing, typography } from "@/ui/design-tokens";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";

export interface CategoryRowProps {
  readonly category: V2Category;
  readonly pendingAction?: string;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
  readonly onDelete: () => void;
}

export function CategoryRow({
  category,
  pendingAction,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: CategoryRowProps) {
  const actionId = (action: "archive" | "restore" | "delete") => `${action}:${category.id}`;

  return (
    <Surface variant="raised" style={styles.card}>
      <Button
        title={category.name}
        variant="ghost"
        disabled={Boolean(pendingAction)}
        onPress={onEdit}
      />
      <Text style={[styles.meta, { color: category.color }]}>
        {category.kind} · {category.archived ? "Archived" : "Active"}
      </Text>
      <View style={styles.rowActions}>
        <Button
          title="Edit"
          variant="secondary"
          disabled={Boolean(pendingAction)}
          onPress={onEdit}
        />
        {category.archived ? (
          <Button
            title="Restore"
            variant="ghost"
            loading={pendingAction === actionId("restore")}
            disabled={Boolean(pendingAction && pendingAction !== actionId("restore"))}
            onPress={onRestore}
          />
        ) : (
          <Button
            title="Archive"
            variant="ghost"
            loading={pendingAction === actionId("archive")}
            disabled={Boolean(pendingAction && pendingAction !== actionId("archive"))}
            onPress={onArchive}
          />
        )}
        <Button
          title="Delete"
          variant="destructive"
          loading={pendingAction === actionId("delete")}
          disabled={Boolean(pendingAction && pendingAction !== actionId("delete"))}
          onPress={onDelete}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[1], padding: spacing[4] },
  meta: { fontFamily: typography.fontBodyNormal, fontSize: typography.textSm },
  rowActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
});
