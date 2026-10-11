import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { v2Assignment, v2Budget, v2Envelope, v2EnvelopeCategory } from "@trove/db/schema/v2-budget";
import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { v2Account, v2Category, v2Ledger } from "@trove/db/schema/v2-ledger";

import { createTestDb } from "../../test-support/db";
import type {
  V2AccountCreateInput,
  V2AssignmentsCreateInput,
  V2BudgetActivateInput,
  V2EnvelopeCreateInput,
  V2EnvelopeUpdateInput,
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
type Harness = Awaited<ReturnType<typeof createHarness>>;
type RequestBody =
  | SeedBody
  | V2BudgetActivateInput
  | V2EnvelopeCreateInput
  | V2EnvelopeUpdateInput
  | V2AssignmentsCreateInput;
type SeedBody = V2AccountCreateInput | V2CategoryCreateInput | V2TransactionCreateInput;

// 2026-10-11 in Dubai. Payday 25 -> current period 2026-09-25..2026-10-24, 14 days left.
const NOW = new Date("2026-10-11T08:00:00Z");
const GUEST = "guest-budget";

/** An app over a fresh PGlite DB with a guest principal and a fixed clock. */
async function createHarness() {
  const db = await createTestDb({ householdLedgerMirror: false });
  await db.insert(v2GuestSession).values({
    id: GUEST,
    tokenHash: "guest-budget-token",
    clientKeyHash: "guest-budget-client",
    status: "active",
    expiresAt: new Date(Date.now() + 60_000),
  });
  const principal: V2Principal = { kind: "guest", guestSessionId: GUEST };
  const app = new Hono();
  // Mirrors createV2Api: thrown V2ApiErrors surface through Hono's onError.
  app.onError((error) =>
    error instanceof V2ApiError
      ? Response.json(
          { error: { code: error.code, details: error.details } },
          { status: error.status },
        )
      : Response.json({ error: { code: "internal_error" } }, { status: 500 }),
  );
  app.route(
    "/api/v2",
    createV2LedgerRoutes({ db, getPrincipal: async () => principal, now: () => NOW }),
  );

  async function send<T = ActiveView>(
    method: string,
    path: string,
    body?: RequestBody,
    key?: string,
    ifMatch?: number,
  ) {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (key) headers.set("Idempotency-Key", key);
    if (ifMatch !== undefined) headers.set("If-Match", String(ifMatch));
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
  return { db, send, seed };
}

describe("V2 budget activation over HTTP", () => {
  let db: TestDb;
  let send: Harness["send"];
  let seed: Harness["seed"];

  beforeEach(async () => {
    ({ db, send, seed } = await createHarness());
  });

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
    expect(response.body).toMatchObject({ error: { code: "budget_overplanned" } });
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

describe("V2 budget envelopes and assignments over HTTP", () => {
  let db: TestDb;
  let send: Harness["send"];
  let seed: Harness["seed"];
  let groceries: string;
  let dining: string;
  let rent: string;

  // Cash 1,000,000. Planned: Groceries 100,000, Dining 50,000 (Everyday), Rent 500,000 (Bills).
  // Not planned yet = 350,000; Safe to spend = 150,000 + 350,000 = 500,000.
  beforeEach(async () => {
    ({ db, send, seed } = await createHarness());
    await seed("/accounts", {
      id: "current",
      name: "Current",
      type: "checking",
      currency: "AED",
      openingBalanceMinor: 1_000_000,
    });
    for (const name of ["groceries", "dining", "rent", "fun"]) {
      await seed("/categories", { id: name, name, kind: "expense" });
    }
    const activated = await send("POST", "/budget/activate", {
      paydayRule: { kind: "day", day: 25 },
      fundingAccountIds: ["current"],
      envelopes: [
        { name: "Groceries", group: "everyday", categoryId: "groceries", plannedMinor: 100_000 },
        { name: "Dining", group: "everyday", categoryId: "dining", plannedMinor: 50_000 },
        { name: "Rent", group: "bills", categoryId: "rent", plannedMinor: 500_000 },
      ],
    });
    expect(activated.status).toBe(201);
    [groceries, dining, rent] = activated.body.envelopes.map((envelope) => envelope.id);
  });

  const totals = (view: ActiveView, id: string) =>
    view.current.envelopes.find((envelope) => envelope.id === id);

  it("moves money between two Everyday envelopes without changing Safe to spend", async () => {
    const moved = await send(
      "POST",
      "/budget/assignments",
      {
        items: [
          { fromEnvelopeId: groceries, toEnvelopeId: dining, amountMinor: 20_000, reason: "move" },
        ],
      },
      "move-1",
    );
    expect(moved.status).toBe(201);
    expect(totals(moved.body, groceries)).toMatchObject({
      plannedMinor: 80_000,
      leftMinor: 80_000,
    });
    expect(totals(moved.body, dining)).toMatchObject({ plannedMinor: 70_000, leftMinor: 70_000 });
    expect(moved.body.current).toMatchObject({
      unassignedMinor: 350_000,
      safeToSpendMinor: 500_000,
    });

    const replay = await send(
      "POST",
      "/budget/assignments",
      {
        items: [
          { fromEnvelopeId: groceries, toEnvelopeId: dining, amountMinor: 20_000, reason: "move" },
        ],
      },
      "move-1",
    );
    expect(replay.body).toEqual(moved.body);
    expect(await db.select().from(v2Assignment)).toHaveLength(4);
  });

  it("covers an overspent Everyday envelope from Not planned yet without changing Safe to spend", async () => {
    await seed("/transactions", {
      id: "big-shop",
      kind: "expense",
      categoryId: "groceries",
      accountId: "current",
      amountMinor: 130_000,
      date: "2026-10-10",
    });
    const before = (await send("GET", "/budget")).body;
    expect(totals(before, groceries)).toMatchObject({ spentMinor: 130_000, leftMinor: -30_000 });
    // cash 870,000 - (-30,000 + 50,000 + 500,000)
    expect(before.current).toMatchObject({ unassignedMinor: 350_000, safeToSpendMinor: 370_000 });

    const covered = await send(
      "POST",
      "/budget/assignments",
      {
        items: [
          { fromEnvelopeId: null, toEnvelopeId: groceries, amountMinor: 30_000, reason: "cover" },
        ],
      },
      "cover-1",
    );
    expect(covered.status).toBe(201);
    expect(totals(covered.body, groceries)).toMatchObject({ plannedMinor: 130_000, leftMinor: 0 });
    expect(covered.body.current).toMatchObject({
      unassignedMinor: 320_000,
      safeToSpendMinor: 370_000,
    });
  });

  it("rejects insufficient funds with the failing index and writes nothing", async () => {
    // Item 0 funds Dining to 60,000, so item 1 may take at most 60,000.
    const tooMuch = await send("POST", "/budget/assignments", {
      items: [
        { fromEnvelopeId: groceries, toEnvelopeId: dining, amountMinor: 10_000, reason: "move" },
        { fromEnvelopeId: dining, toEnvelopeId: rent, amountMinor: 60_001, reason: "move" },
      ],
    });
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.body).toMatchObject({
      error: { code: "insufficient_funds", details: { index: 1, availableMinor: 60_000 } },
    });
    const fromNothing = await send("POST", "/budget/assignments", {
      items: [{ fromEnvelopeId: null, toEnvelopeId: rent, amountMinor: 350_001, reason: "plan" }],
    });
    expect(fromNothing.body).toMatchObject({
      error: { code: "insufficient_funds", details: { index: 0, availableMinor: 350_000 } },
    });
    expect(await db.select().from(v2Assignment)).toHaveLength(3);
  });

  it("lowers Not planned yet for a future-period plan and rejects other period starts", async () => {
    const planned = await send("POST", "/budget/assignments", {
      periodStart: "2026-10-25",
      items: [{ fromEnvelopeId: null, toEnvelopeId: rent, amountMinor: 100_000, reason: "plan" }],
    });
    expect(planned.status).toBe(201);
    expect(totals(planned.body, rent)).toMatchObject({ plannedMinor: 500_000, leftMinor: 500_000 });
    expect(planned.body.current).toMatchObject({
      unassignedMinor: 250_000,
      safeToSpendMinor: 400_000,
    });

    for (const periodStart of ["2026-08-25", "2026-10-26"]) {
      const rejected = await send("POST", "/budget/assignments", {
        periodStart,
        items: [{ fromEnvelopeId: null, toEnvelopeId: rent, amountMinor: 1, reason: "plan" }],
      });
      expect(rejected.status).toBe(422);
      expect(rejected.body).toMatchObject({ error: { code: "invalid_period_start" } });
    }
  });

  it("archiving an envelope returns its Left to Not planned yet and frees its Category", async () => {
    const archived = await send(
      "PATCH",
      `/budget/envelopes/${rent}`,
      { lifecycle: "archived" },
      "archive-1",
      0,
    );
    expect(archived.status).toBe(200);
    expect(archived.body.envelopes.map((envelope) => envelope.id)).toEqual([groceries, dining]);
    expect(archived.body.current).toMatchObject({
      unassignedMinor: 850_000,
      safeToSpendMinor: 1_000_000,
    });
    expect(await db.select().from(v2EnvelopeCategory)).toHaveLength(2);

    const again = await send("PATCH", `/budget/envelopes/${rent}`, { name: "Rent 2" });
    expect(again.body).toMatchObject({ error: { code: "envelope_archived" } });

    const recreated = await send<ActiveView & { envelopeId: string }>("POST", "/budget/envelopes", {
      name: "Rent",
      group: "bills",
      categoryId: "rent",
      plannedMinor: 400_000,
    });
    expect(recreated.status).toBe(201);
    expect(recreated.body.current).toMatchObject({
      unassignedMinor: 450_000,
      safeToSpendMinor: 600_000,
    });
  });

  it("changing the group changes Safe to spend but writes no assignments", async () => {
    const changed = await send(
      "PATCH",
      `/budget/envelopes/${dining}`,
      { group: "bills" },
      "group-1",
      0,
    );
    expect(changed.status).toBe(200);
    // Everyday left is now Groceries 100,000 only: 100,000 + 350,000.
    expect(changed.body.current).toMatchObject({
      unassignedMinor: 350_000,
      safeToSpendMinor: 450_000,
    });
    expect(totals(changed.body, dining)).toMatchObject({ plannedMinor: 50_000, leftMinor: 50_000 });
    expect(await db.select().from(v2Assignment)).toHaveLength(3);

    const stale = await send(
      "PATCH",
      `/budget/envelopes/${dining}`,
      { name: "Eating out" },
      undefined,
      0,
    );
    expect(stale.status).toBe(412);
  });

  it("creates an envelope from Not planned yet and guards the pool and Category mapping", async () => {
    const created = await send<ActiveView & { envelopeId: string }>(
      "POST",
      "/budget/envelopes",
      {
        name: "Eid",
        group: "saving",
        newCategory: { name: "Eid" },
        plannedMinor: 350_000,
        targetMinor: 900_000,
        dueDate: "2027-03-01",
        repeat: "yearly",
      },
      "create-1",
    );
    expect(created.status).toBe(201);
    expect(created.body.envelopes.at(-1)).toMatchObject({
      id: created.body.envelopeId,
      name: "Eid",
      targetMinor: 900_000,
      sortOrder: 3,
    });
    expect(created.body.current).toMatchObject({ unassignedMinor: 0, safeToSpendMinor: 150_000 });

    const overplanned = await send("POST", "/budget/envelopes", {
      name: "Fun",
      group: "everyday",
      categoryId: "fun",
      plannedMinor: 1,
    });
    expect(overplanned.status).toBe(409);
    expect(overplanned.body).toMatchObject({ error: { code: "budget_overplanned" } });
    expect(await db.select().from(v2Envelope)).toHaveLength(4);

    const mapped = await send("POST", "/budget/envelopes", {
      name: "More food",
      group: "everyday",
      categoryId: "groceries",
    });
    expect(mapped.status).toBe(409);
    expect(mapped.body).toMatchObject({ error: { code: "category_already_mapped" } });
    const remap = await send("PATCH", `/budget/envelopes/${dining}`, {
      categoryIds: ["dining", "rent"],
    });
    expect(remap.body).toMatchObject({ error: { code: "category_already_mapped" } });
  });

  it("reads one period's envelope totals and 404s on a non-period", async () => {
    const period = await send<{ period: { start: string }; envelopes: { id: string }[] }>(
      "GET",
      "/budget/periods/2026-09-25",
    );
    expect(period.status).toBe(200);
    expect(period.body.period).toEqual({ start: "2026-09-25", end: "2026-10-24" });
    expect(period.body.envelopes).toEqual([
      { id: groceries, plannedMinor: 100_000, spentMinor: 0, rolloverMinor: 0, leftMinor: 100_000 },
      { id: dining, plannedMinor: 50_000, spentMinor: 0, rolloverMinor: 0, leftMinor: 50_000 },
      { id: rent, plannedMinor: 500_000, spentMinor: 0, rolloverMinor: 0, leftMinor: 500_000 },
    ]);
    expect((await send("GET", "/budget/periods/2026-09-26")).status).toBe(404);
    expect((await send("GET", "/budget/periods/2026-08-25")).status).toBe(404);
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
