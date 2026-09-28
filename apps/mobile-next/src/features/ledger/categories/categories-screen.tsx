import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { EmptyState } from "@/ui/empty-state";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";
import { colors, spacing } from "@/ui/design-tokens";

import { CategoryRow } from "./category-row";
import { confirmLedgerDeletion } from "../delete-confirmation";

type CategoryFilter = "all" | "income" | "expense" | "archived";

export interface CategoriesScreenProps {
  readonly onAddCategory?: () => void;
  readonly onEditCategory?: (id: string) => void;
}

export function CategoriesScreen({ onAddCategory, onEditCategory }: CategoriesScreenProps) {
  const categories = useCategoriesQuery();
  const mutations = useLedgerMutationsWithSound();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [actionError, setActionError] = useState<string>();
  const [pendingAction, setPendingAction] = useState<string>();
  const visible = categories.data.filter((category) => {
    if (filter === "archived") return category.archived;
    if (category.archived) return false;
    return filter === "all" || category.kind === filter;
  });
  const runAction = (
    action: "archive" | "restore" | "delete",
    item: (typeof categories.data)[number],
  ) => {
    const actionId = `${action}:${item.id}`;
    setActionError(undefined);
    setPendingAction(actionId);
    const mutation =
      action === "archive"
        ? mutations.archiveCategory(item.id, item.version)
        : action === "restore"
          ? mutations.restoreCategory(item.id, item.version)
          : mutations.deleteCategory(item.id, item.version);
    void mutation
      .catch((cause) =>
        setActionError(
          cause instanceof Error ? cause.message : `Could not ${action} category. Try again.`,
        ),
      )
      .finally(() => setPendingAction(undefined));
  };
  const confirmDelete = (item: (typeof categories.data)[number]) => {
    confirmLedgerDeletion("category", item.name, () => runAction("delete", item));
  };

  if (categories.isError)
    return (
      <Screen>
        <EmptyState
          title="Categories unavailable"
          message="Check your connection and try again."
          onRetry={() => void categories.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <LegendList
        data={visible}
        keyExtractor={(item) => item.id}
        estimatedItemSize={200}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headline">Categories</Text>
            <Button
              title="Add category"
              disabled={Boolean(pendingAction)}
              onPress={() => {
                setActionError(undefined);
                onAddCategory?.();
              }}
            />
            <View style={styles.chips}>
              {(["all", "income", "expense", "archived"] as const).map((item) => (
                <Chip
                  key={item}
                  label={item[0].toUpperCase() + item.slice(1)}
                  selected={filter === item}
                  onPress={() => setFilter(item)}
                />
              ))}
            </View>
            {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          !categories.isLoading ? (
            <EmptyState
              title="No categories"
              message="Add categories to make entries easier to understand."
              action={onAddCategory ? { label: "Add category", onPress: onAddCategory } : undefined}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <CategoryRow
            category={item}
            pendingAction={pendingAction}
            onEdit={() => {
              setActionError(undefined);
              onEditCategory?.(item.id);
            }}
            onArchive={() => runAction("archive", item)}
            onRestore={() => runAction("restore", item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[2],
    paddingBottom: spacing[16],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  header: { gap: spacing[3], paddingBottom: spacing[2] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  separator: { height: spacing[2] },
  error: { color: colors.destructive },
});
