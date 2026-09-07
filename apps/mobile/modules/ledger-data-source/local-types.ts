import type { OPSQLiteDatabase } from "drizzle-orm/op-sqlite";
import type { SQLiteDatabase } from "@/db/sqlite";

import type { AccountVisibility } from "@/hooks/use-account-visibility";

export type LocalDatabase = OPSQLiteDatabase<typeof import("@/db/schema")> & {
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
