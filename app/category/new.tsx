import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

import { CATEGORY_TYPE_META, type CategoryType } from "@/components/category/category-form-options";
import { CategoryFormContent } from "@/components/category/category-form-content";
import { CategoryFormSheetFooter } from "@/components/category/category-form-sheet-footer";
import { useCategoryForm } from "@/components/category/form";

export default function NewCategoryScreen() {
  const [hasCustomColor, setHasCustomColor] = useState(false);

  const form = useCategoryForm({ onCreated: () => router.back() });

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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="gap-4 px-5 py-4" keyboardShouldPersistTaps="handled">
        <CategoryFormContent
          form={form}
          onColorChange={handleColorChange}
          onTypeChange={handleTypeChange}
        />
      </ScrollView>
      <CategoryFormSheetFooter form={form} onSubmit={() => form.handleSubmit()} />
    </KeyboardAvoidingView>
  );
}
