import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import { CategoryFormContent } from "@/components/category/category-form-content";
import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import { Text } from "@/components/ui/text";
import { useCategory, useDeleteCategory } from "@/hooks/use-categories";
import type { Category } from "@/types";

import { useEditCategoryForm } from "@/components/category/form";

function EditCategorySheet({ category }: { category: Category }) {
  const [error, setError] = useState("");
  const deleteCategory = useDeleteCategory();
  const form = useEditCategoryForm({
    category,
    onError: setError,
    onUpdated: () => router.back(),
  });

  function handleDelete() {
    Alert.alert(
      "Delete Category",
      "Transactions using this category will keep their data but lose the category link.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCategory.mutateAsync(category.id);
            router.back();
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
        <>
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
              />
            )}
          </form.Subscribe>
          <Pressable className="items-center px-5 pb-5" onPress={handleDelete}>
            <Text className="font-body-medium text-sm text-destructive">Delete Category</Text>
          </Pressable>
        </>
      }
      onDismiss={() => router.back()}
      title="Edit Category"
    />
  );
}

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: category, isLoading } = useCategory(id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return category ? <EditCategorySheet category={category} /> : null;
}
