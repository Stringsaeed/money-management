import type { V2Category } from "@trove/api/v2/contracts";
import { StyleSheet, View } from "react-native";

import { Button, CategoryTile, layout, ListGroup, ListRow, space } from "@/ui/trove";

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
  const kind = category.kind === "income" ? "Income" : "Expense";

  return (
    // The inline actions sit under the row because a ListRow has a single press target.
    <ListGroup dividerInset={0}>
      <ListRow
        leading={<CategoryTile icon={category.icon} />}
        title={category.name}
        subtitle={`${kind} · ${category.archived ? "Archived" : "Active"}`}
        accessibilityLabel={`Edit ${category.name}`}
        onPress={pendingAction ? undefined : onEdit}
      />
      <View style={styles.rowActions}>
        <Button
          label="Edit"
          variant="secondary"
          size="sm"
          disabled={Boolean(pendingAction)}
          onPress={onEdit}
        />
        {category.archived ? (
          <Button
            label="Restore"
            variant="tertiary"
            size="sm"
            loading={pendingAction === actionId("restore")}
            disabled={Boolean(pendingAction && pendingAction !== actionId("restore"))}
            onPress={onRestore}
          />
        ) : (
          <Button
            label="Archive"
            variant="tertiary"
            size="sm"
            loading={pendingAction === actionId("archive")}
            disabled={Boolean(pendingAction && pendingAction !== actionId("archive"))}
            onPress={onArchive}
          />
        )}
        <Button
          label="Delete"
          variant="delete"
          size="sm"
          loading={pendingAction === actionId("delete")}
          disabled={Boolean(pendingAction && pendingAction !== actionId("delete"))}
          onPress={onDelete}
        />
      </View>
    </ListGroup>
  );
}

const styles = StyleSheet.create({
  rowActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
    paddingBottom: space[3],
    paddingHorizontal: layout.cardPadding,
  },
});
