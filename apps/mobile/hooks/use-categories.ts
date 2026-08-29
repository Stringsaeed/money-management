import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useLocalCategoryDataSource } from "@/modules/ledger-data-source/local";
import { categoryKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import type { Category } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useCategories(type?: "income" | "expense") {
  const source = useLocalCategoryDataSource();
  const query = useQuery({
    queryKey: type ? categoryKeys.byType(type) : categoryKeys.all,
    queryFn: () => source.reads.categories.categories(type),
  });
  return { ...query, source: source.source };
}

export function useAllCategories() {
  const source = useLocalCategoryDataSource();
  const query = useQuery({
    queryKey: categoryKeys.management,
    queryFn: source.reads.categories.allCategories,
  });
  return { ...query, source: source.source };
}

export function useCategory(id: string) {
  const source = useLocalCategoryDataSource();
  const query = useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => source.reads.categories.category(id),
  });
  return { ...query, source: source.source };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const source = useLocalCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.categories.createCategory,
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "category.created", id }),
  });
  return { ...mutation, source: source.source };
}

export function useUpdateCategory() {
  const source = useLocalCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Category, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">>;
    }) => source.mutations.categories.updateCategory(id, data),
    onSuccess: (_, { id }) => cohereLedgerCache(queryClient, { kind: "category.updated", id }),
  });
  return { ...mutation, source: source.source };
}

export function useDeleteCategory() {
  const source = useLocalCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.categories.deleteCategory,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "category.deleted", id }),
  });
  return { ...mutation, source: source.source };
}

export function useCategoryDeletionPreview(id: string) {
  const source = useLocalCategoryDataSource();
  const query = useQuery({
    queryKey: [...categoryKeys.detail(id), "deletion-preview"],
    queryFn: () => source.reads.categories.deletionPreview(id),
  });
  return { ...query, source: source.source };
}

export function useArchiveCategory() {
  const source = useLocalCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.categories.archiveCategory,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "category.archived", id }),
  });
  return { ...mutation, source: source.source };
}

export function useRestoreCategory() {
  const source = useLocalCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.mutations.categories.restoreCategory,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "category.restored", id }),
  });
  return { ...mutation, source: source.source };
}
