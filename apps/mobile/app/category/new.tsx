import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { CATEGORY_TYPE_META, type CategoryType } from "@/components/category/category-form-options";
import { CategoryFormContent } from "@/components/category/category-form-content";
import { CategoryFormSheetFooter } from "@/components/category/category-form-sheet-footer";
import { useCategoryForm } from "@/components/category/form";
import { colors, spacing } from "@/lib/design-tokens";

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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    gap: spacing[4],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
});
