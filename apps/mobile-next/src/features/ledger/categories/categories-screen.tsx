import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LegendList } from "@legendapp/list/react-native";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import {
  Banner,
  EmptyState,
  Header,
  layout,
  Screen,
  SegmentedControl,
  space,
  type SegmentOption,
} from "@/ui/trove";

import { CategoryRow } from "./category-row";
import { confirmLedgerDeletion } from "../delete-confirmation";

type CategoryFilter = "all" | "income" | "expense" | "archived";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "archived", label: "Archived" },
] as const satisfies readonly SegmentOption<CategoryFilter>[];

export interface CategoriesScreenProps {
  readonly onAddCategory?: () => void;
  readonly onEditCategory?: (id: string) => void;
  readonly onBack?: () => void;
}

export function CategoriesScreen({ onAddCategory, onEditCategory, onBack }: CategoriesScreenProps) {
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

  const addCategory = () => {
    if (pendingAction) return;
    setActionError(undefined);
    onAddCategory?.();
  };
  const headerActions = onAddCategory
    ? [{ icon: "add", label: "Add category", onPress: addCategory } as const]
    : [];

  if (categories.isError)
    return (
      <Screen>
        <View style={styles.top}>
          <Header variant="compact" title="Categories" onBack={onBack} actions={headerActions} />
          <EmptyState
            title="Categories unavailable"
            message="Check your connection and try again."
            icon="info"
            actionLabel="Try again"
            onAction={() => void categories.retry()}
          />
        </View>
      </Screen>
    );

  return (
    <Screen>
      <View style={styles.top}>
        <Header variant="compact" title="Categories" onBack={onBack} actions={headerActions} />
      </View>
      <LegendList
        data={visible}
        keyExtractor={(item) => item.id}
        estimatedItemSize={140}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl
              accessibilityLabel="Filter categories"
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
            {actionError ? <Banner tone="negative" message={actionError} /> : null}
          </View>
        }
        ListEmptyComponent={
          !categories.isLoading ? (
            <EmptyState
              title="No categories"
              message="Add categories to make entries easier to understand."
              icon="category"
              actionLabel={onAddCategory ? "Add category" : undefined}
              onAction={onAddCategory}
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
  top: { gap: space[4], paddingHorizontal: layout.screenGutter },
  content: {
    paddingBottom: space[16],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[4],
  },
  header: { gap: space[3], paddingBottom: space[4] },
  separator: { height: space[3] },
});
