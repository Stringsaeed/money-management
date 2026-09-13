import React, { useState } from "react";
import type { PressableProps } from "react-native";

import { CategoryFormContent } from "@/components/category/category-form-content";
import { CATEGORY_TYPE_META, type CategoryType } from "@/components/category/category-form-options";
import {
  CreateResourceBottomSheet,
  type CreateResourceBottomSheetRef,
} from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";

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
  const sheetRef = React.useRef<CreateResourceBottomSheetRef>(null);

  const form = useCategoryForm({
    initialType,
    onCreated: () => {
      form.reset();
      setHasCustomColor(false);
      sheetRef.current?.dismiss();
      onCreated?.();
    },
  });

  function handleTypeChange(nextType: CategoryType) {
    form.setFieldValue("type", nextType);
    if (!hasCustomColor) form.setFieldValue("color", CATEGORY_TYPE_META[nextType].color);
  }

  function handleColorChange(nextColor: string) {
    setHasCustomColor(true);
    form.setFieldValue("color", nextColor);
  }

  return (
    <CreateResourceBottomSheet
      autoPresent={autoPresent}
      content={
        <CategoryFormContent
          form={form}
          onColorChange={handleColorChange}
          onTypeChange={handleTypeChange}
        />
      }
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <CreateResourceSheetFooter
              isSubmitting={isSubmitting}
              onSubmit={() => form.handleSubmit()}
              submitLabel="Create Category"
            />
          )}
        </form.Subscribe>
      }
      ref={sheetRef}
      title="Add Category"
    >
      {children}
    </CreateResourceBottomSheet>
  );
}
