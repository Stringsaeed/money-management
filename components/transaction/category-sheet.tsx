import React from "react";
import { Pressable, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { INK, INK_MUTED, SHEET_BG, SHEET_HANDLE, SURFACE_CONTAINER } from "./constants";

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface CategorySheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  categories: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

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
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            className="items-center gap-1.5 px-4 py-3 rounded-xl"
            style={{ backgroundColor: isSelected ? `${cat.color}20` : SURFACE_CONTAINER }}
          >
            <Text className="text-[24px]">{cat.icon}</Text>
            <Text
              className="font-body-medium text-[12px]"
              style={{ color: isSelected ? INK : INK_MUTED }}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CategorySheet({ sheetRef, categories, selectedId, onSelect }: CategorySheetProps) {
  const insets = useSafeAreaInsets();
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSelect = (id: string) => {
    onSelect(id);
    sheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      enableDynamicSizing
      ref={sheetRef}
      backgroundStyle={SHEET_BG}
      topInset={insets.top}
      handleIndicatorStyle={SHEET_HANDLE}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
    >
      <BottomSheetView className="pb-safe px-5 gap-5">
        <Text className="font-heading-normal text-[20px] italic text-ink">Category</Text>

        {expenseCategories.length > 0 ? (
          <View className="gap-3">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-[1.5px]">
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
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-[1.5px]">
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
      </BottomSheetView>
    </BottomSheetModal>
  );
}
