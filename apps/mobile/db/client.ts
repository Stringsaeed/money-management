import { useMemo } from "react";
import { drizzle } from "drizzle-orm/op-sqlite";

import { useSQLiteContext } from "@/db/sqlite";

import * as schema from "./schema";

export function useDatabase() {
  const sqlite = useSQLiteContext();
  return useMemo(() => drizzle(sqlite, { schema }), [sqlite]);
}
