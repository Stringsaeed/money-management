import { useState } from "react";
import { Alert, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  useArchiveCategory,
  useCategoryDeletionPreview,
  useDeleteCategory,
  useRestoreCategory,
} from "@/hooks/use-categories";
import type { Category } from "@/types";

interface CategoryLifecycleActionsProps {
  category: Category;
  onCompleted: VoidFunction;
}

export function CategoryLifecycleActions({ category, onCompleted }: CategoryLifecycleActionsProps) {
  const [error, setError] = useState("");
  const archiveCategory = useArchiveCategory();
  const deleteCategory = useDeleteCategory();
  const restoreCategory = useRestoreCategory();
  const deletionPreview = useCategoryDeletionPreview(category.id);

  function confirmArchive() {
    Alert.alert(
      `Archive ${category.name}?`,
      "Past transactions keep this category and this month's Envelope attribution. Future mappings end until you explicitly confirm a new mapping.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: async () => {
            try {
              setError("");
              await archiveCategory.mutateAsync(category.id);
              onCompleted();
            } catch {
              setError("The Category was not archived. Please try again.");
            }
          },
        },
      ],
    );
  }

  function confirmRestore() {
    Alert.alert(
      `Restore ${category.name}?`,
      "This makes the Category selectable again. Its future Envelope mappings stay ended and require separate confirmation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              setError("");
              await restoreCategory.mutateAsync(category.id);
              onCompleted();
            } catch {
              setError("The Category was not restored. Please try again.");
            }
          },
        },
      ],
    );
  }

  function confirmPermanentDelete() {
    Alert.alert(
      `Permanently delete ${category.name}?`,
      "This unused Category has no financial history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              setError("");
              await deleteCategory.mutateAsync(category.id);
              onCompleted();
            } catch {
              setError("The Category was not deleted. Please try again.");
            }
          },
        },
      ],
    );
  }

  return (
    <View className="gap-3 border-t border-ledger-outline pt-5">
      <Text className="font-heading-normal text-lg italic text-ink">Category lifecycle</Text>
      {category.lifecycle === "archived" ? (
        <>
          <Text className="font-body-normal text-sm text-ink/60">
            Archived Categories stay attached to history but cannot be selected for new activity.
          </Text>
          <Button
            aria-label={`Restore ${category.name}`}
            onPress={confirmRestore}
            size="lg"
            variant="secondary"
          >
            <Text>Restore Category</Text>
          </Button>
        </>
      ) : (
        <>
          <Button
            aria-label={`Archive ${category.name}`}
            onPress={confirmArchive}
            size="lg"
            variant="outline"
          >
            <Text>Archive Category</Text>
          </Button>
          {deletionPreview.data?.canDelete ? (
            <Button
              aria-label={`Permanently delete ${category.name}`}
              onPress={confirmPermanentDelete}
              size="lg"
              variant="destructive"
            >
              <Text>Delete Permanently</Text>
            </Button>
          ) : deletionPreview.isSuccess ? (
            <Text className="font-body-normal text-sm text-ink/50">
              Financial history found. Archive this Category instead of permanently deleting it.
            </Text>
          ) : null}
        </>
      )}
      {error ? (
        <Text role="alert" className="font-body-medium text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
