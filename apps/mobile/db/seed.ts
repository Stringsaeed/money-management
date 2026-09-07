/**
 * Demo seed — inserts realistic categories.
 *
 * Versioned rather than a boolean flag: bumping {@link SEED_VERSION} re-runs the
 * seed on every install at next launch, so edits to {@link CATEGORIES} — new
 * rows, renames, recoloured icons — reach existing users instead of only new
 * ones. Rows are upserted by id, so a user's own categories are untouched and
 * their edits to a seeded row are overwritten by the new canonical values.
 *
 * Safe to call repeatedly.
 */
import { eq } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/op-sqlite";

import { nowIso } from "@/utils/date";

import { appSettings, categories } from "./schema";

type DB = ReturnType<typeof drizzle>;

/** Bump when {@link CATEGORIES} changes and every user should pick it up. */
const SEED_VERSION = 2;

const SEED_VERSION_KEY = "seedVersion";

const NOW = nowIso();

const CATEGORIES = [
  // ── Expense ───────────────────────────────────────────────────────────────
  {
    id: "seed_cat_food",
    name: "Food & Dining",
    type: "expense",
    color: "#EF4444",
    icon: "🍽️",
    parentId: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_transport",
    name: "Transport",
    type: "expense",
    color: "#8B5CF6",
    icon: "🚗",
    parentId: null,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_shopping",
    name: "Shopping",
    type: "expense",
    color: "#F97316",
    icon: "🛍️",
    parentId: null,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_housing",
    name: "Housing",
    type: "expense",
    color: "#14B8A6",
    icon: "🏠",
    parentId: null,
    sortOrder: 3,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_health",
    name: "Health",
    type: "expense",
    color: "#EC4899",
    icon: "🏥",
    parentId: null,
    sortOrder: 4,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_entertainment",
    name: "Entertainment",
    type: "expense",
    color: "#6366F1",
    icon: "🎬",
    parentId: null,
    sortOrder: 5,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_utilities",
    name: "Utilities",
    type: "expense",
    color: "#64748B",
    icon: "⚡",
    parentId: null,
    sortOrder: 6,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_subscriptions",
    name: "Subscriptions",
    type: "expense",
    color: "#0EA5E9",
    icon: "🔄",
    parentId: null,
    sortOrder: 7,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // ── Income ────────────────────────────────────────────────────────────────
  {
    id: "seed_cat_salary",
    name: "Salary",
    type: "income",
    color: "#22C55E",
    icon: "💰",
    parentId: null,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_freelance",
    name: "Freelance",
    type: "income",
    color: "#84CC16",
    icon: "💼",
    parentId: null,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "seed_cat_investment",
    name: "Investments",
    type: "income",
    color: "#F59E0B",
    icon: "📈",
    parentId: null,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
] as const;

interface SeedOptions {
  /** Re-run even when the stored version is current — for the dev tools row. */
  force?: boolean;
}

export async function seedDatabase(db: DB, { force = false }: SeedOptions = {}): Promise<void> {
  if (!force && (await readSeedVersion(db)) >= SEED_VERSION) return;

  await db.transaction(async (txDb) => {
    for (const row of CATEGORIES) {
      await txDb
        .insert(categories)
        .values(row)
        .onConflictDoUpdate({
          target: categories.id,
          // createdAt is left alone so a re-seed does not rewrite history.
          set: {
            name: row.name,
            type: row.type,
            color: row.color,
            icon: row.icon,
            sortOrder: row.sortOrder,
            updatedAt: row.updatedAt,
          },
        });
    }

    await txDb
      .insert(appSettings)
      .values({ key: SEED_VERSION_KEY, value: String(SEED_VERSION) })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: String(SEED_VERSION) },
      });
  });
}

/** Sends the seed back to square one, so the next launch re-inserts it. */
export async function clearSeedVersion(db: DB): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key: SEED_VERSION_KEY, value: "0" })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: "0" } })
    .run();
}

async function readSeedVersion(db: DB): Promise<number> {
  const row = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, SEED_VERSION_KEY))
    .get();

  return Number(row?.value) || 0;
}
