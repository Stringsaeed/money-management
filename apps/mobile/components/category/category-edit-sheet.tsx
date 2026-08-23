import { useState } from "react";
import { CategoryFormContent } from "@/components/category/category-form-content";
import { CategoryLifecycleActions } from "@/components/category/category-lifecycle-actions";
import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import type { Category } from "@/types";

import { useEditCategoryForm } from "./form";

interface CategoryEditSheetProps {
  category: Category;
  onDismiss: VoidFunction;
  onUpdated: VoidFunction;
}

export function CategoryEditSheet({ category, onDismiss, onUpdated }: CategoryEditSheetProps) {
  const [error, setError] = useState("");
  const form = useEditCategoryForm({
    category,
    onError: setError,
    onUpdated,
  });

  return (
    <CreateResourceBottomSheet
      autoPresent
      content={
        <>
          <CategoryFormContent
            form={form}
            onColorChange={(color) => form.setFieldValue("color", color)}
            typeEditable={false}
          />
          <CategoryLifecycleActions category={category} onCompleted={onUpdated} />
        </>
      }
      footer={
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <CreateResourceSheetFooter
              error={error}
              isSubmitting={isSubmitting}
              onSubmit={() => {
                setError("");
                form.handleSubmit();
              }}
              submitLabel="Save Changes"
              submittingLabel="Saving…"
            />
          )}
        </form.Subscribe>
      }
      onDismiss={onDismiss}
      title="Edit Category"
    />
  );
}
