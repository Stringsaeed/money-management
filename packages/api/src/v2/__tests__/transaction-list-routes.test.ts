import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb } from "../../test-support/db";
import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { createAccount } from "../accounts";
import { createCategory } from "../categories";
import { createV2LedgerRoutes } from "../ledger-routes";
import { resolveV2LedgerContext, V2ApiError } from "../shared";
import { createTransaction } from "../transactions";
import type { V2Page, V2Transaction, V2TransactionSummary } from "../contracts";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const principal = { kind: "guest", guestSessionId: "guest-list" } as const;

describe("V2 Transaction list routes", () => {
  let app: Hono;

  beforeEach(async () => {
    const db: TestDb = await createTestDb({ householdLedgerMirror: false });
    await db.insert(v2GuestSession).values({
      id: principal.guestSessionId,
      tokenHash: "guest-list-token",
      clientKeyHash: "guest-list-client",
      status: "active",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const context = await resolveV2LedgerContext(db, principal, { kind: "personal" });
    await createAccount(context, { id: "wallet", name: "Wallet", type: "cash", currency: "USD" });
    await createAccount(context, { id: "bank", name: "Bank", type: "checking", currency: "USD" });
    await createCategory(context, { id: "food", name: "Food", kind: "expense" });
    await createCategory(context, { id: "rent", name: "Rent", kind: "expense" });
    await createCategory(context, { id: "salary", name: "Salary", kind: "income" });
    const rows = [
      { id: "t1", kind: "income", categoryId: "salary", amountMinor: 5_000, date: "2026-09-01" },
      { id: "t2", kind: "expense", categoryId: "food", amountMinor: 120, date: "2026-09-02" },
      { id: "t3", kind: "expense", categoryId: "rent", amountMinor: 2_000, date: "2026-09-02" },
      { id: "t4", kind: "expense", categoryId: "food", amountMinor: 80, date: "2026-09-03" },
      { id: "t5", kind: "expense", categoryId: "food", amountMinor: 40, date: "2026-09-04" },
      { id: "t6", kind: "expense", categoryId: null, amountMinor: 15, date: "2026-09-05" },
    ] as const;
    for (const row of rows) {
      await createTransaction(context, {
        ...row,
        accountId: "wallet",
        note: row.id === "t5" ? "50% off_lunch" : `note ${row.id}`,
      });
    }
    await createTransaction(context, {
      id: "t7",
      kind: "transfer",
      accountId: "wallet",
      toAccountId: "bank",
      amountMinor: 300,
      date: "2026-09-06",
    });
    app = new Hono();
    // Mirrors createV2Api: thrown V2ApiErrors surface through Hono's onError.
    app.onError((error) =>
      error instanceof V2ApiError
        ? Response.json({ error: { code: error.code } }, { status: error.status })
        : Response.json({ error: { code: "internal_error" } }, { status: 500 }),
    );
    app.route("/api/v2", createV2LedgerRoutes({ db, getPrincipal: async () => principal }));
  });

  async function page(query: string): Promise<V2Page<V2Transaction>> {
    const response = await app.request(`http://test/api/v2/transactions?${query}`);
    expect(response.status).toBe(200);
    // SAFETY: a 200 from /transactions is the documented page envelope.
    return (await response.json()) as V2Page<V2Transaction>;
  }

  it("walks every row newest-first across cursor pages without gaps or repeats", async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const result: V2Page<V2Transaction> = await page(
        `limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      );
      seen.push(...result.items.map((item) => item.id));
      cursor = result.nextCursor;
      pages += 1;
    } while (cursor);
    expect(pages).toBe(3);
    expect(seen).toEqual(["t7", "t6", "t5", "t4", "t3", "t2", "t1"]);
  });

  it("combines repeated filters with OR inside a field and AND across fields", async () => {
    const byCategories = await page("categoryId=food&categoryId=salary");
    expect(byCategories.items.map((item) => item.id)).toEqual(["t5", "t4", "t2", "t1"]);

    const foodInRange = await page("categoryId=food&from=2026-09-03&to=2026-09-04");
    expect(foodInRange.items.map((item) => item.id)).toEqual(["t5", "t4"]);

    const kinds = await page("kind=income&kind=transfer");
    expect(kinds.items.map((item) => item.id)).toEqual(["t7", "t1"]);
  });

  it("matches transfer destinations when filtering by Account", async () => {
    const bank = await page("accountId=bank");
    expect(bank.items.map((item) => item.id)).toEqual(["t7"]);
  });

  it("treats search wildcards as literal text", async () => {
    expect((await page("q=50%25")).items.map((item) => item.id)).toEqual(["t5"]);
    expect((await page("q=off_l")).items.map((item) => item.id)).toEqual(["t5"]);
    expect((await page("q=%25")).items.map((item) => item.id)).toEqual(["t5"]);
    expect((await page("q=NOTE%20T6")).items.map((item) => item.id)).toEqual(["t6"]);
  });

  it("summarizes the full filtered set independent of paging", async () => {
    const response = await app.request(
      "http://test/api/v2/transactions/summary?kind=income&kind=expense",
    );
    expect(response.status).toBe(200);
    // SAFETY: a 200 from /transactions/summary is the documented summary contract.
    expect((await response.json()) as V2TransactionSummary).toEqual({
      count: 6,
      totals: [
        {
          currency: "USD",
          count: 6,
          incomeMinor: 5_000,
          expenseMinor: 2_255,
          netMinor: 2_745,
        },
      ],
    });
  });

  it.each([
    ["cursor=not-a-cursor", "invalid_cursor"],
    ["cursor=2026-13-01:t1", "invalid_cursor"],
    ["kind=refund", "invalid_kind"],
    ["from=yesterday", "invalid_from"],
    ["limit=-1", "invalid_limit"],
  ])("rejects %s", async (query, code) => {
    const response = await app.request(`http://test/api/v2/transactions?${query}`);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code } });
  });
});
