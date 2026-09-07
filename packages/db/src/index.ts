import { AsyncLocalStorage } from "node:async_hooks";
import { env } from "@trove/env/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type SqlClient = ReturnType<typeof postgres>;

const requestClients = new AsyncLocalStorage<SqlClient[]>();

export function createDb() {
  const client = postgres(env.HYPERDRIVE_FRESH.connectionString, {
    max: 5,
    fetch_types: false,
  });
  requestClients.getStore()?.push(client);
  return drizzle({ client, schema });
}

export async function withDbScope<T>(
  run: () => Promise<T>,
  waitUntil?: { waitUntil(promise: Promise<unknown>): void },
): Promise<T> {
  const created: SqlClient[] = [];
  try {
    return await requestClients.run(created, run);
  } finally {
    const closing = Promise.allSettled(created.map((client) => client.end({ timeout: 5 })));
    if (waitUntil) {
      waitUntil.waitUntil(closing);
    } else {
      await closing;
    }
  }
}
