import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

import type { CategoryPickerProps } from "./types";

type CategoryItem = CategoryPickerProps["categories"][number];

function CategoryGrid({
  items,
  selectedId,
  onSelect,
}: {
  items: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.gridContainer}>
      {items.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <Pressable
            aria-label={cat.name}
            aria-selected={isSelected}
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[styles.categoryItem, !isSelected && styles.categoryItemDefault]}
            {...(isSelected && {
              style: [styles.categoryItem, { backgroundColor: `${cat.color}20` }],
            })}
            role="button"
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryName,
                isSelected ? styles.categoryNameSelected : styles.categoryNameDefault,
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CategoryPicker({
  categories,
  selectedId,
  onChange,
  children,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);

  const selectableCategories = categories.filter((category) => category.lifecycle !== "archived");
  const incomeCategories = selectableCategories.filter((category) => category.type === "income");
  const expenseCategories = selectableCategories.filter((category) => category.type === "expense");

  const onOpen = () => {
    setOpen(true);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const renderTrigger = () => {
    if (children) {
      const child = React.Children.only(children);
      // SAFETY: Picker pattern expects a single pressable child element
      return React.cloneElement(child as React.ReactElement<PressableProps>, {
        onPress: onOpen,
      });
    }
    return null;
  };

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet open={open} onDismiss={() => setOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Category</Text>

          {expenseCategories.length > 0 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Expenses</Text>
              <CategoryGrid
                items={expenseCategories}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </View>
          ) : null}

          {incomeCategories.length > 0 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Income</Text>
              <CategoryGrid
                items={incomeCategories}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </View>
          ) : null}

          <View style={styles.bottomSpacer} />
        </View>
      </ModalBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[5],
  },
  sheetTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  sectionContainer: {
    gap: spacing[3],
  },
  sectionLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: 10,
    color: colors.ink,
    opacity: 0.4,
    textTransform: "uppercase",
    letterSpacing: typography.trackingWider,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  categoryItem: {
    alignItems: "center",
    gap: spacing[1.5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.xl,
  },
  categoryItemDefault: {
    backgroundColor: colors.kumoFill,
  },
  categoryIcon: {
    fontSize: typography.text2xl,
  },
  categoryName: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
  },
  categoryNameSelected: {
    color: colors.ink,
  },
  categoryNameDefault: {
    color: colors.ink,
    opacity: 0.4,
  },
  bottomSpacer: {
    height: spacing[4],
  },
});
