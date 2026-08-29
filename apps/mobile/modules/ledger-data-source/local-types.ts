import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import type { AccountVisibility } from "@/hooks/use-account-visibility";

export type LocalDatabase = ExpoSQLiteDatabase<typeof import("@/db/schema")> & {
  $client: SQLiteDatabase;
};

export interface LocalDatabaseDependency {
  db: LocalDatabase;
}

export interface LocalSQLiteDependency {
  sqlite: SQLiteDatabase;
}

export interface LocalVisibilityDependency {
  visibility: AccountVisibility;
}
