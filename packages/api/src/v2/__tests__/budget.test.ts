import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { v2Assignment, v2Budget } from "@trove/db/schema/v2-budget";
import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { v2Account, v2Category, v2Ledger } from "@trove/db/schema/v2-ledger";

import { createTestDb } from "../../test-support/db";
import type {
  V2AccountCreateInput,
  V2BudgetActivateInput,
  V2BudgetView,
  V2CategoryCreateInput,
  V2Principal,
  V2TransactionCreateInput,
} from "../contracts";
import { claimGuestLedger } from "../guest-claim";
import { createV2LedgerRoutes } from "../ledger-routes";
import { V2ApiError } from "../shared";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;
type ActiveView = Extract<V2BudgetView, { readonly budget: object }>;
type SeedBody = V2AccountCreateInput | V2CategoryCreateInput | V2TransactionCreateInput;

// 2026-10-11 in Dubai. Payday 25 -> current period 2026-09-25..2026-10-24, 14 days left.
const NOW = new Date("2026-10-11T08:00:00Z");
const GUEST = "guest-budget";

describe("V2 budget activation over HTTP", () => {
  let db: TestDb;
  let app: Hono;

  beforeEach(async () => {
    db = await createTestDb({ householdLedgerMirror: false });
    await db.insert(v2GuestSession).values({
      id: GUEST,
      tokenHash: "guest-budget-token",
      clientKeyHash: "guest-budget-client",
      status: "active",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const principal: V2Principal = { kind: "guest", guestSessionId: GUEST };
    app = new Hono();
    // Mirrors createV2Api: thrown V2ApiErrors surface through Hono's onError.
    app.onError((error) =>
      error instanceof V2ApiError
        ? Response.json({ error: { code: error.code } }, { status: error.status })
        : Response.json({ error: { code: "internal_error" } }, { status: 500 }),
    );
    app.route(
      "/api/v2",
      createV2LedgerRoutes({ db, getPrincipal: async () => principal, now: () => NOW }),
    );
  });

  async function send<T = ActiveView>(
    method: string,
    path: string,
    body?: SeedBody | V2BudgetActivateInput,
    key?: string,
  ) {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (key) headers.set("Idempotency-Key", key);
    const response = await app.request(`http://test/api/v2${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // SAFETY: every V2 route answers JSON; each test asserts the status before relying on T.
    return { status: response.status, body: (await response.json()) as T };
  }

  async function seed(path: string, body: SeedBody) {
    const result = await send("POST", path, body, `seed-${body.id ?? path}`);
    expect(result.status).toBe(201);
  }

  async function seedLedger() {
    await seed("/accounts", {
      id: "current",
      name: "Current",
      type: "checking",
      currency: "AED",
      openingBalanceMinor: 1_000_000,
    });
    await seed("/accounts", { id: "card", name: "Card", type: "credit_card", currency: "AED" });
    await seed("/categories", { id: "groceries", name: "Groceries", kind: "expense" });
    await seed("/categories", { id: "rent", name: "Rent", kind: "expense" });
    const expense = { kind: "expense", categoryId: "groceries" } as const;
    // Before the period: lowers cash, never counted as envelope spending.
    await seed("/transactions", {
      ...expense,
      id: "t-before",
      accountId: "current",
      amountMinor: 20_000,
      date: "2026-09-20",
    });
    // In the period but logged before activation: counted once.
    await seed("/transactions", {
      ...expense,
      id: "t-early",
      accountId: "current",
      amountMinor: 30_000,
      date: "2026-10-01",
    });
    // Card purchase, partly paid off: 6,000 stays reserved.
    await seed("/transactions", {
      ...expense,
      id: "t-card",
      accountId: "card",
      amountMinor: 10_000,
      date: "2026-10-05",
    });
    await seed("/transactions", {
      id: "t-pay-card",
      kind: "transfer",
      accountId: "current",
      toAccountId: "card",
      amountMinor: 4_000,
      date: "2026-10-06",
    });
    // Dated after today: does not count yet.
    await seed("/transactions", {
      ...expense,
      id: "t-future",
      accountId: "current",
      amountMinor: 5_000,
      date: "2026-10-20",
    });
  }

  const plan: V2BudgetActivateInput = {
    paydayRule: { kind: "day", day: 25 },
    usualSalaryMinor: 1_500_000,
    fundingAccountIds: ["current"],
    envelopes: [
      { name: "Groceries", group: "everyday", categoryId: "groceries", plannedMinor: 100_000 },
      { name: "Rent", group: "bills", newCategory: { name: "rent" }, plannedMinor: 500_000 },
      {
        name: "Ramadan & Eid",
        group: "saving",
        newCategory: { name: "Ramadan & Eid" },
        plannedMinor: 50_000,
        targetMinor: 300_000,
        dueDate: "2027-03-01",
        repeat: "yearly",
        setAsideMinor: 20_000,
      },
    ],
  };

  it("activates atomically and GET /budget returns the projected Safe to spend", async () => {
    await seedLedger();
    const activated = await send("POST", "/budget/activate", plan, "activate-1");
    expect(activated.status).toBe(201);

    const read = await send("GET", "/budget");
    expect(read.status).toBe(200);
    const view = read.body;
    expect(view).toEqual(activated.body);
    expect(view.budget).toMatchObject({
      currency: "AED",
      activationPeriodStart: "2026-09-25",
      usualSalaryMinor: 1_500_000,
      paydayReminder: true,
      defaultAccountId: "current",
    });
    expect(view.paydayRule).toEqual({ kind: "day", day: 25 });
    expect(view.fundingAccountIds).toEqual(["current"]);
    // "rent" reuses the existing Rent category; "Ramadan & Eid" is created.
    expect(view.envelopes.map((envelope) => envelope.categoryIds[0])).toEqual([
      "groceries",
      "rent",
      expect.any(String),
    ]);

    // cash = 1,000,000 - 20,000 - 30,000 - 4,000 = 946,000
    // Groceries left = 100,000 - (30,000 + 10,000 card) = 60,000; Rent 500,000; Eid 70,000
    // Not planned yet = 946,000 - 630,000 - 6,000 card reserve = 310,000
    expect(view.current).toEqual({
      period: { start: "2026-09-25", end: "2026-10-24" },
      unassignedMinor: 310_000,
      safeToSpendMinor: 370_000,
      perDayMinor: 26_400,
      daysLeft: 14,
      cardReserveMinor: 6_000,
      envelopes: [
        expect.objectContaining({ plannedMinor: 100_000, spentMinor: 40_000, leftMinor: 60_000 }),
        expect.objectContaining({ plannedMinor: 500_000, spentMinor: 0, leftMinor: 500_000 }),
        expect.objectContaining({ plannedMinor: 70_000, spentMinor: 0, leftMinor: 70_000 }),
      ],
    });
  });

  it("replays the same Idempotency-Key and rejects a second activation", async () => {
    await seedLedger();
    const first = await send("POST", "/budget/activate", plan, "activate-1");
    const replay = await send("POST", "/budget/activate", plan, "activate-1");
    expect(replay.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    expect(await db.select().from(v2Budget)).toHaveLength(1);
    expect(await db.select().from(v2Assignment)).toHaveLength(4);

    const again = await send("POST", "/budget/activate", plan, "activate-2");
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ error: { code: "budget_already_active" } });
  });

  it("rejects an overplan and writes nothing", async () => {
    const response = await send(
      "POST",
      "/budget/activate",
      {
        paydayRule: { kind: "last_workday" },
        openingCashMinor: 100_000,
        envelopes: [
          {
            name: "Groceries",
            group: "everyday",
            newCategory: { name: "Groceries" },
            plannedMinor: 100_001,
          },
        ],
      },
      "overplan",
    );
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { code: "budget_overplanned" } });
    expect(await send("GET", "/budget")).toEqual({ status: 200, body: { budget: null } });
    expect(await db.select().from(v2Account)).toHaveLength(0);
    expect(await db.select().from(v2Category)).toHaveLength(0);
  });

  it("creates a My money cash account from one typed total", async () => {
    const response = await send(
      "POST",
      "/budget/activate",
      {
        paydayRule: { kind: "day", day: 1 },
        openingCashMinor: 500_000,
        envelopes: [
          {
            name: "Groceries",
            group: "everyday",
            newCategory: { name: "Groceries" },
            plannedMinor: 200_000,
          },
        ],
      },
      "my-money",
    );
    expect(response.status).toBe(201);
    const view = response.body;
    const accounts = await db.select().from(v2Account);
    expect(accounts).toEqual([
      expect.objectContaining({
        name: "My money",
        type: "cash",
        currency: "AED",
        openingBalanceMinor: 500_000,
      }),
    ]);
    expect(view.fundingAccountIds).toEqual([accounts[0]?.id]);
    expect(view.budget.defaultAccountId).toBe(accounts[0]?.id);
    expect(view.current).toMatchObject({
      period: { start: "2026-10-01", end: "2026-10-31" },
      unassignedMinor: 300_000,
      safeToSpendMinor: 500_000,
    });
  });
});

describe("guest claim with a budget", () => {
  it("treats a guest budget as a fact and keeps both ledgers", async () => {
    const db = await createTestDb({ householdLedgerMirror: false });
    await db.insert(v2Ledger).values([
      { id: "v2:guest:g1", ownerType: "guest", ownerId: "g1" },
      { id: "v2:user:u1", ownerType: "user", ownerId: "u1" },
    ]);
    await db.insert(v2Budget).values({
      ledgerId: "v2:guest:g1",
      id: "budget-g1",
      currency: "AED",
      activationPeriodStart: "2026-09-25",
      createdBy: "g1",
      updatedBy: "g1",
    });
    await db.insert(v2Account).values({
      ledgerId: "v2:user:u1",
      id: "user-account",
      name: "Current",
      type: "checking",
      currency: "AED",
      createdBy: "u1",
      updatedBy: "u1",
    });

    expect(await claimGuestLedger(db, "g1", "u1")).toEqual({
      kind: "conflict",
      guestLedgerId: "v2:guest:g1",
      userLedgerId: "v2:user:u1",
    });
    expect(
      await db.select().from(v2Budget).where(eq(v2Budget.ledgerId, "v2:guest:g1")),
    ).toHaveLength(1);
  });
});
