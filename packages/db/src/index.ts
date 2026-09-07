import { AsyncLocalStorage } from "node:async_hooks";
import { env } from "@trove/env/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const openConnection = () => {
  const client = postgres(env.HYPERDRIVE_FRESH.connectionString, {
    max: 5,
    fetch_types: false,
  });
  return { client, db: drizzle({ client, schema }) };
};

type DbConnection = ReturnType<typeof openConnection>;

interface DbScope {
  connection?: DbConnection;
}

const requestScope = new AsyncLocalStorage<DbScope>();

export function createDb() {
  const scope = requestScope.getStore();
  if (!scope) return openConnection().db;
  scope.connection ??= openConnection();
  return scope.connection.db;
}

export async function withDbScope<T>(
  run: () => Promise<T>,
  waitUntil?: { waitUntil(promise: Promise<unknown>): void },
): Promise<T> {
  const scope: DbScope = {};
  try {
    return await requestScope.run(scope, run);
  } finally {
    const client = scope.connection?.client;
    if (client) {
      const closing = Promise.allSettled([client.end({ timeout: 5 })]);
      if (waitUntil) {
        waitUntil.waitUntil(closing);
      } else {
        await closing;
      }
    }
  }
}
