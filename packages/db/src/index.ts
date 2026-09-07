import { env } from "@trove/env/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function createDb() {
  const client = postgres(env.HYPERDRIVE_FRESH.connectionString, {
    max: 5,
    fetch_types: false,
  });
  return drizzle({ client, schema });
}
