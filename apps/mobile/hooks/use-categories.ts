import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCategoryDataSource } from "@/modules/ledger-data-source/coordinator";
import { categoryKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import type { Category } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useCategories(type?: "income" | "expense") {
  const source = useCategoryDataSource();
  const query = useQuery({
    queryKey: type ? categoryKeys.byType(type) : categoryKeys.all,
    queryFn: () => source.categories.list(type),
  });
  return { ...query, source: source.source };
}

export function useAllCategories() {
  const source = useCategoryDataSource();
  const query = useQuery({
    queryKey: categoryKeys.management,
    queryFn: () => source.categories.list(undefined, true),
  });
  return { ...query, source: source.source };
}

export function useCategory(id: string) {
  const source = useCategoryDataSource();
  const query = useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => source.categories.get(id),
  });
  return { ...query, source: source.source };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const source = useCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.categories.create,
    onSuccess: (id) => cohereLedgerCache(queryClient, { kind: "category.created", id }),
  });
  return { ...mutation, source: source.source };
}

export function useUpdateCategory() {
  const source = useCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Category, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">>;
    }) => source.categories.update(id, data),
    onSuccess: (_, { id }) => cohereLedgerCache(queryClient, { kind: "category.updated", id }),
  });
  return { ...mutation, source: source.source };
}

export function useDeleteCategory() {
  const source = useCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => {
      if (source.categoryLifecycle.kind !== "local") {
        throw new Error("Category deletion is not available for the synced ledger yet.");
      }
      return source.categoryLifecycle.delete(id);
    },
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "category.deleted", id }),
  });
  return { ...mutation, source: source.source };
}

export function useCategoryDeletionPreview(id: string) {
  const source = useCategoryDataSource();
  const query = useQuery({
    queryKey: [...categoryKeys.detail(id), "deletion-preview"],
    queryFn: () => {
      if (source.categoryLifecycle.kind !== "local") {
        throw new Error("Category deletion preview is not available for the synced ledger yet.");
      }
      return source.categoryLifecycle.deletionPreview(id);
    },
  });
  return { ...query, source: source.source };
}

export function useArchiveCategory() {
  const source = useCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: source.categories.archive,
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "category.archived", id }),
  });
  return { ...mutation, source: source.source };
}

export function useRestoreCategory() {
  const source = useCategoryDataSource();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => {
      if (source.categoryLifecycle.kind !== "local") {
        throw new Error("Category restore is not available for the synced ledger yet.");
      }
      return source.categoryLifecycle.restore(id);
    },
    onSuccess: (_, id) => cohereLedgerCache(queryClient, { kind: "category.restored", id }),
  });
  return { ...mutation, source: source.source };
}
