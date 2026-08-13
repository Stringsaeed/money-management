import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, useColorScheme, View } from "react-native";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";

import { Text } from "@/components/ui/text";
import type { CategoryPickerProps } from "./types";

type CategoryItem = CategoryPickerProps["categories"][number];

function CategoryGrid({
  items,
  selectedId,
  onSelect,
  isDark,
}: {
  items: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isDark: boolean;
}) {
  const surfaceContainer = isDark ? "#1E1D1C" : "#F1F0EE";
  const inkColor = isDark ? "#E8E6E3" : "#1C1B1A";
  const inkMuted = isDark ? "#E8E6E366" : "#1C1B1A66";

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            className="items-center gap-1.5 px-4 py-3 rounded-xl"
            style={{ backgroundColor: isSelected ? `${cat.color}20` : surfaceContainer }}
          >
            <Text className="text-2xl">{cat.icon}</Text>
            <Text
              className="font-body-medium text-xs"
              style={{ color: isSelected ? inkColor : inkMuted }}
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
  const [sheetIndex, setSheetIndex] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const onOpen = () => {
    setSheetIndex(1);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setSheetIndex(0);
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
      <ModalBottomSheet
        index={sheetIndex}
        onIndexChange={setSheetIndex}
        scrimColor="rgba(0, 0, 0, 0.5)"
        surface={<View className="absolute inset-0 rounded-t-3xl bg-background" />}
      >
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
                isDark={isDark}
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
                isDark={isDark}
              />
            </View>
          ) : null}

          <View className="h-4" />
        </View>
      </ModalBottomSheet>
    </>
  );
}
