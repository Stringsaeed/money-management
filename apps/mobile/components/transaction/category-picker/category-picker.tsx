import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
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
    <View className="flex-row flex-wrap gap-2">
      {items.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <Pressable
            aria-label={cat.name}
            aria-selected={isSelected}
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            className={cn(
              "items-center gap-1.5 px-4 py-3 rounded-xl",
              !isSelected && "bg-kumo-fill",
            )}
            style={isSelected ? { backgroundColor: `${cat.color}20` } : undefined}
            role="button"
          >
            <Text className="text-2xl">{cat.icon}</Text>
            <Text
              className={cn("font-body-medium text-xs", isSelected ? "text-ink" : "text-ink/40")}
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
        <View className="pb-safe px-5 pt-5 gap-5">
          <Text className="font-heading-normal text-xl italic text-ink">Category</Text>

          {expenseCategories.length > 0 ? (
            <View className="gap-3">
              <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wider">
                Expenses
              </Text>
              <CategoryGrid
                items={expenseCategories}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </View>
          ) : null}

          {incomeCategories.length > 0 ? (
            <View className="gap-3">
              <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-wider">
                Income
              </Text>
              <CategoryGrid
                items={incomeCategories}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </View>
          ) : null}

          <View className="h-4" />
        </View>
      </ModalBottomSheet>
    </>
  );
}
