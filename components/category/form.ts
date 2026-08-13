import { formOptions, useForm } from "@tanstack/react-form";

import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import type { Category } from "@/types";

import {
  CATEGORY_TYPE_META,
  DEFAULT_CATEGORY_ICON,
  type CategoryType,
} from "./category-form-options";

export interface CategoryFormValues {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

interface UseCategoryFormArgs {
  initialType?: CategoryType;
  onCreated?: VoidFunction;
}

interface UseEditCategoryFormArgs {
  category: Category;
  onError?: (message: string) => void;
  onUpdated?: VoidFunction;
}

export const categoryFormOptions = formOptions({
  defaultValues: {
    name: "",
    type: "expense",
    color: CATEGORY_TYPE_META.expense.color,
    icon: DEFAULT_CATEGORY_ICON,
  } as CategoryFormValues,
});

export function useCategoryForm({ initialType = "expense", onCreated }: UseCategoryFormArgs = {}) {
  const createCategory = useCreateCategory();

  return useForm({
    ...categoryFormOptions,
    defaultValues: {
      ...categoryFormOptions.defaultValues,
      type: initialType,
      color: CATEGORY_TYPE_META[initialType].color,
    },
    onSubmit: async ({ value }) => {
      try {
        await createCategory.mutateAsync({
          name: value.name.trim(),
          type: value.type,
          color: value.color,
          icon: value.icon,
          parentId: null,
          sortOrder: 0,
        });
        onCreated?.();
      } catch {
        // Surfaced by the mutation's error state; the form stays open so the
        // user can retry.
      }
    },
  });
}

export type UseCategoryFormReturn = ReturnType<typeof useCategoryForm>;

export function useEditCategoryForm({ category, onError, onUpdated }: UseEditCategoryFormArgs) {
  const updateCategory = useUpdateCategory();

  return useForm({
    ...categoryFormOptions,
    defaultValues: {
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateCategory.mutateAsync({
          id: category.id,
          data: {
            name: value.name.trim(),
            color: value.color,
            icon: value.icon,
          },
        });
        onUpdated?.();
      } catch {
        onError?.("Failed to update category.");
      }
    },
  });
}
