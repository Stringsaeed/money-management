import { useState } from "react";
import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { EmptyState } from "@/ui/empty-state";
import { Sheet } from "@/ui/sheet";
import { Text } from "@/ui/text";

import { BreadcrumbSegment } from "./breadcrumb-segment";
import { afterSheetCloses } from "./transaction-create-actions";
import { categoryChip, categoryEmoji } from "./transaction-display";

interface CategoryPickerProps {
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly isTransfer: boolean;
  readonly onSelectCategory: (category: V2Category) => void;
  readonly onSelectTransfer: () => void;
  readonly onCreateCategory?: () => void;
}

interface CategoryTileProps {
  readonly emoji: string;
  readonly label: string;
  readonly selected: boolean;
  readonly tint?: string;
  readonly onPress: () => void;
}

function CategoryTile({ emoji, label, selected, tint, onPress }: CategoryTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tile,
        // Dynamic category color from data: 20% alpha tint on the selected tile.
        selected && (tint ? { backgroundColor: `${tint}33` } : styles.tileSelected),
      ]}
    >
      <NativeText style={styles.tileEmoji}>{emoji}</NativeText>
      <Text numberOfLines={1} style={[styles.tileLabel, !selected && styles.tileLabelIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface CategorySectionProps {
  readonly title: string;
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly onSelect: (category: V2Category) => void;
}

function CategorySection({ title, categories, selectedId, onSelect }: CategorySectionProps) {
  if (categories.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="label">{title}</Text>
      <View style={styles.grid}>
        {categories.map((category) => (
          <CategoryTile
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
  onSelectCategory,
  onSelectTransfer,
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
  );
  const highlightedId = isTransfer ? null : selectedId;
  const selectCategory = (category: V2Category) => {
    onSelectCategory(category);
    setOpen(false);
  };

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
          onSelect={selectCategory}
        />
        <CategorySection
          title="💰 Income"
          categories={categories.filter((item) => item.kind === "income")}
          selectedId={highlightedId}
          onSelect={selectCategory}
        />
        <View style={styles.section}>
          <Text variant="label">🏦 Move money</Text>
          <View style={styles.grid}>
            <CategoryTile
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
  tile: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.xl,
    gap: spacing[1.5],
    minWidth: spacing[20],
    maxWidth: spacing[32],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  tileSelected: { backgroundColor: colors.surfaceDim },
  tileEmoji: { color: colors.ink, fontSize: typography.text2xl },
  tileLabel: {
    color: colors.ink,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
  },
  tileLabelIdle: { opacity: 0.55 },
});
