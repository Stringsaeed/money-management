import { and, eq } from "drizzle-orm";

import { categories } from "@/db/schema";
import {
  archiveCategory,
  deleteCategory,
  previewCategoryDeletion,
  restoreCategory,
} from "@/modules/categories/category-lifecycle";
import { nowIso, toDateString } from "@/utils/date";
import { generateId } from "@/utils/id";
import type { Category } from "@/types";

import type { CategoryUpdate, LedgerOperationRunner, NewCategory } from "./contract";
import type { LocalDatabaseDependency, LocalSQLiteDependency } from "./local-types";

export const createLocalCategoryPort = (
  { db, sqlite }: LocalDatabaseDependency & LocalSQLiteDependency,
  runner: LedgerOperationRunner,
) => ({
  reads: {
    categories: (type?: "income" | "expense") =>
      runner.run("read.categories", async () => {
        const query = db.select().from(categories).orderBy(categories.sortOrder, categories.name);
        return (await query
          .where(
            type
              ? and(eq(categories.lifecycle, "active"), eq(categories.type, type))
              : eq(categories.lifecycle, "active"),
          )
          .all()) as Category[];
      }),
    allCategories: () =>
      runner.run(
        "read.category-management",
        async () =>
          (await db
            .select()
            .from(categories)
            .orderBy(categories.sortOrder, categories.name)
            .all()) as Category[],
      ),
    category: (id: string) =>
      runner.run("read.category", async () => {
        return (await db.select().from(categories).where(eq(categories.id, id)).get()) as
          | Category
          | undefined;
      }),
    deletionPreview: (id: string) =>
      runner.run("read.category-deletion-preview", () => previewCategoryDeletion(sqlite, id)),
  },
  mutations: {
    createCategory: (data: NewCategory) =>
      runner.run("mutation.category-create", async () => {
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
      }),
    updateCategory: (id: string, data: CategoryUpdate) =>
      runner.run("mutation.category-update", async () => {
        await db
          .update(categories)
          .set({ ...data, updatedAt: nowIso() })
          .where(eq(categories.id, id));
      }),
    archiveCategory: (id: string) =>
      runner.run("mutation.category-archive", () => {
        const archivedAt = new Date();
        return archiveCategory(sqlite, {
          categoryId: id,
          localDate: toDateString(archivedAt),
          now: archivedAt.toISOString(),
        });
      }),
    restoreCategory: (id: string) =>
      runner.run("mutation.category-restore", () =>
        restoreCategory(sqlite, { categoryId: id, now: nowIso() }),
      ),
    deleteCategory: (id: string) =>
      runner.run("mutation.category-delete", () => deleteCategory(sqlite, id)),
  },
});
