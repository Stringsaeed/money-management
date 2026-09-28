import { useState } from "react";
import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { spacing, typography } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";

import { OptionTile } from "../editor/option-tile";

import { hasAiPickChoice } from "./ai-pick";
import { BreadcrumbSegment } from "./breadcrumb-segment";
import { afterSheetCloses } from "./transaction-create-actions";
import { categoryChip, categoryEmoji } from "./transaction-display";

type CategoryKind = V2Category["kind"];

interface CategoryPickerProps {
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

interface CategorySectionProps {
  readonly title: string;
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly autoSelected: boolean;
  readonly onSelect: (category: V2Category) => void;
  readonly onSelectAuto?: () => void;
}

function CategorySection({
  title,
  categories,
  selectedId,
  autoSelected,
  onSelect,
  onSelectAuto,
}: CategorySectionProps) {
  if (categories.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="label">{title}</Text>
      <View style={styles.grid}>
        {onSelectAuto ? (
          <OptionTile emoji="✨" label="AI pick" selected={autoSelected} onPress={onSelectAuto} />
        ) : null}
        {categories.map((category) => (
          <OptionTile
            key={category.id}
            emoji={categoryEmoji(category.icon)}
            label={category.name}
            selected={category.id === selectedId}
            tint={category.color}
            onPress={() => onSelect(category)}
          />
        ))}
      </View>
    </View>
  );
}

export function CategoryPicker({
  categories,
  selectedId,
  isTransfer,
  autoKind,
  onSelectCategory,
  onSelectTransfer,
  onSelectAuto,
  onCreateCategory,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const createCategory = onCreateCategory
    ? () => {
        setOpen(false);
        afterSheetCloses(onCreateCategory);
      }
    : undefined;
  const chip = categoryChip(
    categories.find((item) => item.id === selectedId),
    isTransfer,
    autoKind !== null,
  );
  const highlightedId = isTransfer ? null : selectedId;
  const selectCategory = (category: V2Category) => {
    onSelectCategory(category);
    setOpen(false);
  };
  const selectAuto = (kind: CategoryKind) =>
    onSelectAuto && hasAiPickChoice(categories, kind)
      ? () => {
          onSelectAuto(kind);
          setOpen(false);
        }
      : undefined;

  return (
    <>
      <BreadcrumbSegment {...chip} onPress={() => setOpen(true)} />
      <Sheet open={open} onDismiss={() => setOpen(false)}>
        <Text variant="title">🏷️ Category</Text>
        {categories.length === 0 ? (
          <EmptyState
            icon={<NativeText style={styles.emptyEmoji}>🌱</NativeText>}
            title="No categories yet"
            message="Add a category to sort your spending and income. You can still record a transfer below."
            action={createCategory ? { label: "Add category", onPress: createCategory } : undefined}
          />
        ) : null}
        <CategorySection
          title="💸 Expenses"
          categories={categories.filter((item) => item.kind === "expense")}
          selectedId={highlightedId}
          autoSelected={autoKind === "expense"}
          onSelect={selectCategory}
          onSelectAuto={selectAuto("expense")}
        />
        <CategorySection
          title="💰 Income"
          categories={categories.filter((item) => item.kind === "income")}
          selectedId={highlightedId}
          autoSelected={autoKind === "income"}
          onSelect={selectCategory}
          onSelectAuto={selectAuto("income")}
        />
        <View style={styles.section}>
          <Text variant="label">🏦 Move money</Text>
          <View style={styles.grid}>
            <OptionTile
              emoji="🔁"
              label="Transfer"
              selected={isTransfer}
              onPress={() => {
                onSelectTransfer();
                setOpen(false);
              }}
            />
          </View>
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[2] },
  emptyEmoji: { fontSize: typography.text2xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
});
