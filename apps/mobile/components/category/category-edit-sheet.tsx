import { useState } from "react";
import { Alert } from "react-native";

import { CategoryFormContent } from "@/components/category/category-form-content";
import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import { ResourceSheetDeleteButton } from "@/components/resource/resource-sheet-delete-button";
import { useDeleteCategory } from "@/hooks/use-categories";
import type { Category } from "@/types";

import { useEditCategoryForm } from "./form";

interface CategoryEditSheetProps {
  category: Category;
  onDismiss: VoidFunction;
  onUpdated: VoidFunction;
}

export function CategoryEditSheet({ category, onDismiss, onUpdated }: CategoryEditSheetProps) {
  const [error, setError] = useState("");
  const deleteCategory = useDeleteCategory();
  const form = useEditCategoryForm({
    category,
    onError: setError,
    onUpdated,
  });

  function handleDelete() {
    Alert.alert(
      `Delete ${category.name}?`,
      "Transactions using this category will keep their data but lose the category link.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory.mutateAsync(category.id);
              onDismiss();
            } catch {
              Alert.alert(
                "Couldn't Delete Category",
                "The category was not deleted. Please try again.",
              );
            }
          },
        },
      ],
    );
  }

  return (
    <CreateResourceBottomSheet
      autoPresent
      content={
        <CategoryFormContent
          form={form}
          onColorChange={(color) => form.setFieldValue("color", color)}
          typeEditable={false}
        />
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
      headerRight={
        <ResourceSheetDeleteButton label={`Delete ${category.name}`} onPress={handleDelete} />
      }
      onDismiss={onDismiss}
      title="Edit Category"
    />
  );
}
