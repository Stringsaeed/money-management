import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { useDatabase } from "@/db/client";
import { categories } from "@/db/schema";
import { categoryKeys, cohereLedgerCache } from "@/modules/ledger-cache";
import { generateId } from "@/utils/id";
import { nowIso } from "@/utils/date";
import type { Category } from "@/types";

// ── Queries ────────────────────────────────────────────────────────────────────

export function useCategories(type?: "income" | "expense") {
  const db = useDatabase();
  return useQuery({
    queryKey: type ? categoryKeys.byType(type) : categoryKeys.all,
    queryFn: async (): Promise<Category[]> => {
      const query = db.select().from(categories).orderBy(categories.sortOrder, categories.name);
      if (type) {
        return query.where(eq(categories.type, type)).all() as Category[];
      }
      return query.all() as Category[];
    },
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
    mutationFn: async (data: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
      const now = nowIso();
      const id = generateId();
      await db.insert(categories).values({ ...data, id, createdAt: now, updatedAt: now });
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
      data: Partial<Omit<Category, "id" | "createdAt">>;
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
  const db = useDatabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(categories).where(eq(categories.id, id));
    },
    onSuccess: (_, id) => cohereLedgerCache(qc, { kind: "category.deleted", id }),
  });
}
