import { StyleSheet, View } from "react-native";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { EmptyState, Header, layout, Screen, Skeleton, space } from "@/ui/trove";

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
        <View accessibilityState={{ busy: true }} style={styles.status}>
          <Skeleton height={32} width="60%" />
          <Skeleton height={96} />
        </View>
      </Screen>
    );
  if (id && !category)
    return (
      <Screen>
        <View style={styles.status}>
          <Header variant="compact" title="Category" onBack={onDone} />
          <EmptyState
            title="Category not found"
            message="This category may have been deleted."
            icon="info"
            actionLabel="Try again"
            onAction={() => void categories.retry()}
          />
        </View>
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
  status: { gap: space[4], padding: layout.screenGutter },
});
