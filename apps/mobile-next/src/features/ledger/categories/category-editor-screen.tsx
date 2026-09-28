import { StyleSheet } from "react-native";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { colors, spacing } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { IconButton } from "@/ui/icon-button";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

import { CategoryEditorForm } from "./category-editor-form";
import { useCategoryEditorActions } from "./use-category-editor-actions";

export interface CategoryEditorScreenProps {
  /** Category to edit; omit to create a new one. */
  readonly id?: string;
  readonly onDone?: () => void;
}

export function CategoryEditorScreen({ id, onDone }: CategoryEditorScreenProps) {
  const categories = useCategoriesQuery();
  const category = id ? categories.data.find((item) => item.id === id) : undefined;
  const actions = useCategoryEditorActions(category, onDone);

  if (id && categories.isLoading)
    return (
      <Screen>
        <Text style={styles.status}>Loading category…</Text>
      </Screen>
    );
  if (id && !category)
    return (
      <Screen>
        {onDone ? (
          <IconButton name="x" accessibilityLabel="Close" onPress={onDone} style={styles.close} />
        ) : null}
        <EmptyState
          title="Category not found"
          message="This category may have been deleted."
          onRetry={() => void categories.retry()}
        />
      </Screen>
    );

  return (
    <Screen>
      <CategoryEditorForm
        category={category}
        busy={actions.busy}
        error={actions.error}
        onCancel={onDone}
        onSubmit={actions.save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.mutedForeground, padding: spacing[5] },
  close: { margin: spacing[4] },
});
