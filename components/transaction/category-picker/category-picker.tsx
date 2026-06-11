import React, { useRef } from "react";
import type { PressableProps } from "react-native";
import { Pressable, useColorScheme, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const sheetBg = { backgroundColor: isDark ? "#141312" : "#F9F8F6" };
  const sheetHandle = { backgroundColor: isDark ? "#282624" : "#EBE8E3" };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const onOpen = () => {
    ref.current?.present();
  };

  const handleSelect = (id: string) => {
    onChange(id);
    ref.current?.dismiss();
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
      <BottomSheetModal
        enableDynamicSizing
        ref={ref}
        backgroundStyle={sheetBg}
        topInset={insets.top}
        handleIndicatorStyle={sheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetView className="pb-safe px-5 gap-5">
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
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
