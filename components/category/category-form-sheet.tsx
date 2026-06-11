import React, { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable, ScrollView, View } from "react-native";
import { XIcon } from "phosphor-react-native";

import { CATEGORY_TYPE_META, type CategoryType } from "@/components/category/category-form-options";
import { CategoryFormContent } from "@/components/category/category-form-content";
import { Icon } from "@/components/ui/icon";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";
import { Text } from "../ui/text";
import { CategoryFormSheetFooter } from "./category-form-sheet-footer";
import { useCategoryForm } from "./form";

interface CategoryFormBottomSheetProps {
  autoPresent?: boolean;
  children?: React.ReactElement<PressableProps>;
  initialType?: CategoryType;
  onCreated?: VoidFunction;
}

export function CategoryFormBottomSheet({
  autoPresent = false,
  children,
  initialType = "expense",
  onCreated,
}: CategoryFormBottomSheetProps) {
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [index, setIndex] = useState(autoPresent ? 1 : 0);

  const form = useCategoryForm({
    initialType,
    onCreated: () => {
      setIndex(0);
      form.reset();
      setHasCustomColor(false);
      onCreated?.();
    },
  });

  function handleTypeChange(nextType: CategoryType) {
    form.setFieldValue("type", nextType);

    if (!hasCustomColor) {
      form.setFieldValue("color", CATEGORY_TYPE_META[nextType].color);
    }
  }

  function handleColorChange(nextColor: string) {
    setHasCustomColor(true);
    form.setFieldValue("color", nextColor);
  }

  function renderTrigger() {
    if (!children) {
      return null;
    }

    const child = React.Children.only(children);
    return React.cloneElement(child as React.ReactElement<PressableProps>, {
      onPress: (event) => {
        setIndex(1);
        child.props.onPress?.(event);
      },
    });
  }

  return (
    <>
      {renderTrigger()}
      <ModalBottomSheet scrimColor="rgba(0, 0, 0, 0.5)" index={index} onIndexChange={setIndex}>
        <View className="bg-background rounded-3xl mb-7 mx-4 flex-1">
          <View className="flex-row items-center px-3 py-3">
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setIndex(0)}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-dim"
            >
              <Icon as={XIcon} size={20} className="text-ink" />
            </Pressable>
            <Text className="flex-1 font-heading-normal text-center text-xl italic text-ink">
              Add Category
            </Text>
            <View className="w-10 h-10" />
          </View>
          <ScrollView contentContainerClassName="gap-4 px-5 py-4">
            <CategoryFormContent
              form={form}
              onColorChange={handleColorChange}
              onTypeChange={handleTypeChange}
            />
          </ScrollView>
          <CategoryFormSheetFooter form={form} onSubmit={() => form.handleSubmit()} />
        </View>
      </ModalBottomSheet>
    </>
  );
}
