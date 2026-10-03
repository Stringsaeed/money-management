import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { v2GuestSession } from "@trove/db/schema/v2-identity";

import { createTestDb } from "../../test-support/db";
import { CATEGORIZE_QUOTA, consumeAiQuota, pruneAiUsage } from "../ai-quota";
import type { CategorizeOptions, CategorizeRequest, TransactionCategorizer } from "../categorizer";
import { createV2LedgerRoutes } from "../ledger-routes";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;
type JsonBody = Readonly<Record<string, string | number | boolean | null>>;

const post = (body: JsonBody, key: string) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", "Idempotency-Key": key },
  body: JSON.stringify(body),
});

const transaction = (overrides: JsonBody = {}) => ({
  id: "tx",
  accountId: "wallet",
  kind: "expense",
  amountMinor: 45_000,
  date: "2026-09-28",
  note: "Breadfast",
  autoCategorize: true,
  ...overrides,
});

describe("V2 Transaction create with autoCategorize", () => {
  let db: TestDb;
  let calls: { request: CategorizeRequest; options?: CategorizeOptions }[];

  const appWith = async (categorizer?: TransactionCategorizer) => {
    const app = new Hono();
    app.route(
      "/api/v2",
      createV2LedgerRoutes({
        db,
        categorizer,
        getPrincipal: async () => ({ kind: "guest", guestSessionId: "guest-ai" }),
      }),
    );
    await app.request(
      "http://test/api/v2/accounts",
      post({ id: "wallet", name: "Wallet", type: "cash", currency: "EGP" }, "account"),
    );
    for (const [id, name, kind] of [
      ["groceries", "Groceries", "expense"],
      ["dining", "Dining", "expense"],
      ["salary", "Salary", "income"],
    ]) {
      await app.request(
        "http://test/api/v2/categories",
        post({ id, name, kind }, `category-${id}`),
      );
    }
    return app;
  };

  const picking = (categoryId: string | null): TransactionCategorizer => ({
    categorize: async (request, options) => {
      calls.push({ request, options });
      return categoryId
        ? { categoryId, stage: "research" }
        : { categoryId: null, stage: "unknown" };
    },
  });

  const create = async (app: Hono, body: JsonBody, key = "transaction") => {
    const response = await app.request("http://test/api/v2/transactions", post(body, key));
    expect(response.status).toBe(201);
    return response.json();
  };

  beforeEach(async () => {
    calls = [];
    db = await createTestDb({ householdLedgerMirror: false });
    await db.insert(v2GuestSession).values({
      id: "guest-ai",
      tokenHash: "guest-ai-token",
      clientKeyHash: "guest-ai-client",
      status: "active",
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  it("creates and categorizes in one request, sending only the note, currency, and matching names", async () => {
    const app = await appWith(picking("groceries"));

    expect(await create(app, transaction())).toMatchObject({
      id: "tx",
      categoryId: "groceries",
      version: 1,
      autoCategorization: {
        outcome: "categorized",
        source: "research",
        category: { id: "groceries", name: "Groceries" },
      },
    });
    expect(calls[0]?.request).toEqual({
      note: "Breadfast",
      kind: "expense",
      currency: "EGP",
      categories: [
        { id: "dining", name: "Dining" },
        { id: "groceries", name: "Groceries" },
      ],
    });
    expect(calls[0]?.options?.signal).toBeInstanceOf(AbortSignal);
  });

  it("does not call AI unless asked, and never replaces a chosen category", async () => {
    const app = await appWith(picking("groceries"));

    const plain = await create(app, transaction({ autoCategorize: false }));
    expect(plain).not.toHaveProperty("autoCategorization");
    expect(plain).toMatchObject({ categoryId: null });

    expect(
      await create(app, transaction({ id: "chosen", categoryId: "dining" }), "chosen"),
    ).toMatchObject({ categoryId: "dining", autoCategorization: { outcome: "skipped" } });
    expect(calls).toHaveLength(0);
  });

  it("skips AI when the transaction's kind has only one category to pick", async () => {
    const app = await appWith(picking("salary"));

    expect(await create(app, transaction({ kind: "income", note: "Upwork payout" }))).toMatchObject(
      { categoryId: null, autoCategorization: { outcome: "skipped" } },
    );
    expect(calls).toHaveLength(0);
  });

  it("still creates the transaction when AI is unsure, missing, or failing", async () => {
    const unsure = await appWith(picking(null));
    expect(await create(unsure, transaction())).toMatchObject({
      categoryId: null,
      autoCategorization: { outcome: "uncategorized" },
    });

    const missing = await appWith();
    expect(await create(missing, transaction({ id: "tx-2" }), "tx-2")).toMatchObject({
      categoryId: null,
      autoCategorization: { outcome: "unavailable" },
    });

    const failing = await appWith({
      categorize: async () => {
        throw new Error("gateway down");
      },
    });
    expect(await create(failing, transaction({ id: "tx-3" }), "tx-3")).toMatchObject({
      categoryId: null,
      autoCategorization: { outcome: "unavailable" },
    });
  });

  it("stops calling AI once the person's burst quota is spent", async () => {
    const app = await appWith(picking("groceries"));
    const [burst] = CATEGORIZE_QUOTA;
    for (let used = 0; used < (burst?.limit ?? 0); used += 1)
      await consumeAiQuota(db, "guest:guest-ai", CATEGORIZE_QUOTA);

    expect(await create(app, transaction())).toMatchObject({
      categoryId: null,
      autoCategorization: { outcome: "rate_limited" },
    });
    expect(calls).toHaveLength(0);
  });
});

describe("AI quota", () => {
  it("counts per subject and window, and prunes expired windows", async () => {
    const db = await createTestDb({ householdLedgerMirror: false });
    const windows = [{ name: "test", limit: 2, durationMs: 60_000 }];
    const now = new Date("2026-09-28T10:00:30Z");

    expect(await consumeAiQuota(db, "user:a", windows, now)).toBe(true);
    expect(await consumeAiQuota(db, "user:a", windows, now)).toBe(true);
    expect(await consumeAiQuota(db, "user:a", windows, now)).toBe(false);
    expect(await consumeAiQuota(db, "user:b", windows, now)).toBe(true);
    const nextWindow = new Date("2026-09-28T10:01:00Z");
    expect(await consumeAiQuota(db, "user:a", windows, nextWindow)).toBe(true);

    await pruneAiUsage(db, new Date("2026-09-28T10:01:30Z"));
    expect(await consumeAiQuota(db, "user:a", windows, nextWindow)).toBe(true);
    expect(await consumeAiQuota(db, "user:a", windows, nextWindow)).toBe(false);
  });
});
