import { router } from "expo-router";
import { useState } from "react";

import { CATEGORY_TYPE_META, type CategoryType } from "@/components/category/category-form-options";
import { CategoryFormContent } from "@/components/category/category-form-content";
import { CategoryFormSheetFooter } from "@/components/category/category-form-sheet-footer";
import { useCategoryForm } from "@/components/category/form";
import { CreateResourceFormScreen } from "@/components/resource/create-resource-form-screen";

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

  function handleSubmit() {
    void form.handleSubmit();
  }

  return (
    <CreateResourceFormScreen
      footer={<CategoryFormSheetFooter form={form} onSubmit={handleSubmit} />}
    >
      <CategoryFormContent
        form={form}
        onColorChange={handleColorChange}
        onTypeChange={handleTypeChange}
      />
    </CreateResourceFormScreen>
  );
}
