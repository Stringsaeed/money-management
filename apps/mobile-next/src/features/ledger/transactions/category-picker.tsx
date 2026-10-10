import { StyleSheet, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { EmptyState, OptionTile, OptionTileGrid, Sheet, space, Text } from "@/ui/trove";

import { hasAiPickChoice } from "./ai-pick";
import { CategoryPickerSection } from "./category-picker-section";
import { afterSheetCloses } from "./transaction-create-actions";
import { TRANSFER_EMOJI } from "./transaction-display";

type CategoryKind = V2Category["kind"];

interface CategoryPickerProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly isTransfer: boolean;
  /** Kind whose "AI pick" is selected, or null when a category or transfer is. */
  readonly autoKind: CategoryKind | null;
  readonly onSelectCategory: (category: V2Category) => void;
  readonly onSelectTransfer: () => void;
  /** Omitted when AI is off or the transaction is being edited. */
  readonly onSelectAuto?: (kind: CategoryKind) => void;
  readonly onCreateCategory?: () => void;
}

/**
 * Sheet of category tile grids, one per kind plus the transfer tile. Sections stay (instead of
 * one flat grid) because a category's kind decides the transaction type.
 */
export function CategoryPicker({
  open,
  onDismiss,
  categories,
  selectedId,
  isTransfer,
  autoKind,
  onSelectCategory,
  onSelectTransfer,
  onSelectAuto,
  onCreateCategory,
}: CategoryPickerProps) {
  const createCategory = onCreateCategory
    ? () => {
        onDismiss();
        afterSheetCloses(onCreateCategory);
      }
    : undefined;
  const highlightedId = isTransfer ? null : selectedId;
  const selectCategory = (category: V2Category) => {
    onSelectCategory(category);
    onDismiss();
  };
  const selectAuto = (kind: CategoryKind) =>
    onSelectAuto && hasAiPickChoice(categories, kind)
      ? () => {
          onSelectAuto(kind);
          onDismiss();
        }
      : undefined;
  const section = (title: string, kind: CategoryKind) => (
    <CategoryPickerSection
      title={title}
      categories={categories.filter((item) => item.kind === kind)}
      selectedId={highlightedId}
      autoSelected={autoKind === kind}
      onSelect={selectCategory}
      onSelectAuto={selectAuto(kind)}
    />
  );

  return (
    <Sheet open={open} onDismiss={onDismiss} title="Category">
      {categories.length === 0 ? (
        <EmptyState
          actionLabel={createCategory ? "Add category" : undefined}
          framed={false}
          icon="category"
          message="Add a category to sort your spending and income. You can still record a transfer below."
          onAction={createCategory}
          title="No categories yet"
        />
      ) : null}
      {section("Expenses", "expense")}
      {section("Income", "income")}
      <View style={styles.section}>
        <Text accessibilityRole="header" tone="secondary" variant="labelMd">
          Move money
        </Text>
        <OptionTileGrid accessibilityLabel="Move money">
          <OptionTile
            emoji={TRANSFER_EMOJI}
            layout="grid"
            name="Transfer"
            onPress={() => {
              onSelectTransfer();
              onDismiss();
            }}
            selected={isTransfer}
          />
        </OptionTileGrid>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ section: { gap: space[2] } });
