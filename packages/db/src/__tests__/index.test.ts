// oxlint-disable anti-slop/no-module-mocking -- Cloudflare env and Postgres are runtime boundaries
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDb, withDbScope } from "../index";

const mocks = vi.hoisted(() => {
  const clients: { readonly end: ReturnType<typeof vi.fn> }[] = [];
  const postgres = vi.fn(() => {
    const client = { end: vi.fn(async () => undefined) };
    clients.push(client);
    return client;
  });
  const drizzle = vi.fn(({ client }: { readonly client: unknown }) => ({ client }));
  return { clients, drizzle, postgres };
});

vi.mock("@trove/env/server", () => ({
  env: { HYPERDRIVE_FRESH: { connectionString: "postgres://request-scope.test/db" } },
}));
vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: mocks.drizzle }));
vi.mock("postgres", () => ({ default: mocks.postgres }));

beforeEach(() => {
  mocks.clients.splice(0);
  mocks.drizzle.mockClear();
  mocks.postgres.mockClear();
});

describe("request-scoped database lifecycle", () => {
  it("reuses one database and closes its client once after the request", async () => {
    await withDbScope(async () => {
      expect(createDb()).toBe(createDb());
      expect(mocks.postgres).toHaveBeenCalledTimes(1);
      expect(mocks.drizzle).toHaveBeenCalledTimes(1);
    });

    expect(mocks.clients).toHaveLength(1);
    expect(mocks.clients[0]?.end).toHaveBeenCalledTimes(1);
  });

  it("closes the shared client once when the request throws", async () => {
    await expect(
      withDbScope(async () => {
        createDb();
        createDb();
        throw new Error("request failed");
      }),
    ).rejects.toThrow("request failed");

    expect(mocks.clients).toHaveLength(1);
    expect(mocks.clients[0]?.end).toHaveBeenCalledTimes(1);
  });

  it("schedules the single close with waitUntil when provided", async () => {
    const waitUntil = vi.fn();

    await withDbScope(
      async () => {
        createDb();
        createDb();
      },
      { waitUntil },
    );

    expect(mocks.clients).toHaveLength(1);
    expect(mocks.clients[0]?.end).toHaveBeenCalledTimes(1);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await waitUntil.mock.calls[0]?.[0];
  });

  it("keeps calls outside a request scope independent", () => {
    expect(createDb()).not.toBe(createDb());
    expect(mocks.postgres).toHaveBeenCalledTimes(2);
    expect(mocks.clients.every((client) => client.end.mock.calls.length === 0)).toBe(true);
  });
});
