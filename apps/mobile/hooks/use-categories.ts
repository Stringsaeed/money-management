import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, eq } from "drizzle-orm";
import { useSQLiteContext } from "expo-sqlite";

import { useDatabase } from "@/db/client";
import { categories } from "@/db/schema";
import { categoryKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import {
  archiveCategory,
  deleteCategory,
  previewCategoryDeletion,
  restoreCategory,
} from "@/modules/categories/category-lifecycle";
import { generateId } from "@/utils/id";
import { nowIso, toDateString } from "@/utils/date";
import type { Category } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useCategories(type?: "income" | "expense") {
  const db = useDatabase();
  return useQuery({
    queryKey: type ? categoryKeys.byType(type) : categoryKeys.all,
    queryFn: async (): Promise<Category[]> => {
      const query = db.select().from(categories).orderBy(categories.sortOrder, categories.name);
      return (await query
        .where(
          type
            ? and(eq(categories.lifecycle, "active"), eq(categories.type, type))
            : eq(categories.lifecycle, "active"),
        )
        .all()) as Category[];
    },
  });
}

export function useAllCategories() {
  const db = useDatabase();
  return useQuery({
    queryKey: categoryKeys.management,
    queryFn: async () =>
      (await db
        .select()
        .from(categories)
        .orderBy(categories.sortOrder, categories.name)
        .all()) as Category[],
  });
}

export function useCategory(id: string) {
  const db = useDatabase();
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () =>
      db.select().from(categories).where(eq(categories.id, id)).get() as Category | undefined,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<Category, "id" | "createdAt" | "updatedAt" | "lifecycle" | "lifecycleChangedAt">,
    ) => {
      const now = nowIso();
      const id = generateId();
      await db.insert(categories).values({
        ...data,
        id,
        lifecycle: "active",
        lifecycleChangedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },
    onSuccess: (id) => cohereLedgerCache(qc, { kind: "category.created", id }),
  });
}

export function useUpdateCategory() {
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Category, "id" | "createdAt" | "lifecycle" | "lifecycleChangedAt">>;
    }) => {
      await db
        .update(categories)
        .set({ ...data, updatedAt: nowIso() })
        .where(eq(categories.id, id));
    },
    onSuccess: (_, { id }) => cohereLedgerCache(qc, { kind: "category.updated", id }),
  });
}

export function useDeleteCategory() {
  const database = useSQLiteContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteCategory(database, id);
    },
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "category.deleted", id }),
  });
}

export function useCategoryDeletionPreview(id: string) {
  const database = useSQLiteContext();
  return useQuery({
    queryKey: [...categoryKeys.detail(id), "deletion-preview"],
    queryFn: () => previewCategoryDeletion(database, id),
  });
}

export function useArchiveCategory() {
  const database = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const archivedAt = new Date();
      return archiveCategory(database, {
        categoryId: id,
        localDate: toDateString(archivedAt),
        now: archivedAt.toISOString(),
      });
    },
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "category.archived", id }),
  });
}

export function useRestoreCategory() {
  const database = useSQLiteContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreCategory(database, { categoryId: id, now: nowIso() }),
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "category.restored", id }),
  });
}
