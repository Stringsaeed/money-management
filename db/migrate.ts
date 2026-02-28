import { type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { eq } from "drizzle-orm";

import { generateId } from "@/utils/id";
import { nowIso } from "@/utils/date";
import { categories, appSettings } from "./schema";
import migrations from "./migrations/migrations";

// ── Default seed data ─────────────────────────────────────────────────────────

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food & Dining", icon: "fork.knife", color: "#FF6B6B" },
  { name: "Transport", icon: "car.fill", color: "#4ECDC4" },
  { name: "Housing", icon: "house.fill", color: "#45B7D1" },
  { name: "Utilities", icon: "bolt.fill", color: "#F7DC6F" },
  { name: "Healthcare", icon: "cross.fill", color: "#E74C3C" },
  { name: "Entertainment", icon: "tv.fill", color: "#9B59B6" },
  { name: "Shopping", icon: "bag.fill", color: "#E67E22" },
  { name: "Education", icon: "book.fill", color: "#3498DB" },
  { name: "Personal Care", icon: "heart.fill", color: "#F1948A" },
  { name: "Other", icon: "ellipsis.circle.fill", color: "#95A5A6" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "dollarsign.circle.fill", color: "#27AE60" },
  { name: "Freelance", icon: "briefcase.fill", color: "#2ECC71" },
  { name: "Investment", icon: "chart.line.uptrend.xyaxis", color: "#1ABC9C" },
  { name: "Gift", icon: "gift.fill", color: "#F39C12" },
  { name: "Other Income", icon: "plus.circle.fill", color: "#52BE80" },
];

const DEFAULT_SETTINGS: { key: string; value: string }[] = [
  { key: "homeCurrency", value: "USD" },
  { key: "dateFormat", value: "MM/DD/YYYY" },
  { key: "firstDayOfWeek", value: "0" },
  { key: "seeded", value: "false" },
];

async function seedDefaultData(db: ExpoSQLiteDatabase) {
  // Check if already seeded
  const settingRow = await db.select().from(appSettings).where(eq(appSettings.key, "seeded")).get();

  if (settingRow?.value === "true") return;

  const now = nowIso();

  // Insert default settings
  for (const setting of DEFAULT_SETTINGS) {
    await db.insert(appSettings).values(setting).onConflictDoNothing().run();
  }

  // Insert expense categories
  for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
    const cat = DEFAULT_EXPENSE_CATEGORIES[i];
    await db.insert(categories).values({
      id: generateId(),
      name: cat.name,
      type: "expense",
      icon: cat.icon,
      color: cat.color,
      parentId: null,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Insert income categories
  for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
    const cat = DEFAULT_INCOME_CATEGORIES[i];
    await db.insert(categories).values({
      id: generateId(),
      name: cat.name,
      type: "income",
      icon: cat.icon,
      color: cat.color,
      parentId: null,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Mark as seeded
  await db.update(appSettings).set({ value: "true" }).where(eq(appSettings.key, "seeded")).run();
}

export async function runMigrations(db: ExpoSQLiteDatabase) {
  await migrate(db, migrations);
  await seedDefaultData(db);
}
