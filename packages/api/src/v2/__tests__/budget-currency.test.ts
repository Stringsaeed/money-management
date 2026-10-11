import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { v2EnvelopeCategory } from "@trove/db/schema/v2-budget";
import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { v2Transaction } from "@trove/db/schema/v2-ledger";

import { createTestDb, type TestDbOptions } from "../../test-support/db";
import type {
  V2AccountCreateInput,
  V2AssignmentsCreateInput,
  V2BudgetActivateInput,
  V2BudgetActivity,
  V2BudgetList,
  V2BudgetSetupFacts,
  V2BudgetUpdateInput,
  V2BudgetView,
  V2CategoryCreateInput,
  V2DueList,
  V2EnvelopeCreateInput,
  V2EnvelopePayInput,
  V2EnvelopeUpdateInput,
  V2Principal,
  V2RecordedOccurrence,
  V2RecurringCreateInput,
  V2RecurringPayInput,
  V2RecurringRule,
  V2TransactionCreateInput,
} from "../contracts";
import { createV2LedgerRoutes } from "../ledger-routes";
import { V2ApiError } from "../shared";

type ActiveView = Extract<V2BudgetView, { readonly budget: object }>;
type RequestBody =
  | V2AccountCreateInput
  | V2CategoryCreateInput
  | V2TransactionCreateInput
  | V2RecurringCreateInput
  | V2RecurringPayInput
  | V2BudgetActivateInput
  | V2BudgetUpdateInput
  | V2EnvelopeCreateInput
  | V2EnvelopePayInput
  | V2EnvelopeUpdateInput
  | V2AssignmentsCreateInput;
interface ErrorBody {
  readonly error: { readonly code: string };
}

// 2026-10-11 in Dubai. Payday 25 -> current period 2026-09-25..2026-10-24.
const NOW = new Date("2026-10-11T08:00:00Z");
const GUEST = "guest-budget-currency";

/** An app over a fresh PGlite DB with a guest principal and a fixed clock. */
async function createHarness(options: TestDbOptions = {}) {
  const db = await createTestDb({ ...options, householdLedgerMirror: false });
  await db.insert(v2GuestSession).values({
    id: GUEST,
    tokenHash: "guest-budget-currency-token",
    clientKeyHash: "guest-budget-currency-client",
    status: "active",
    expiresAt: new Date(Date.now() + 60_000),
  });
  const principal: V2Principal = { kind: "guest", guestSessionId: GUEST };
  const app = new Hono();
  app.onError((error) =>
    error instanceof V2ApiError
      ? Response.json({ error: { code: error.code } }, { status: error.status })
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

  async function seed(path: string, body: RequestBody & { readonly id?: string }) {
    const result = await send("POST", path, body, `seed-${body.id ?? path}`);
    expect(result.status).toBe(201);
  }
  return { db, send, seed };
}

type Harness = Awaited<ReturnType<typeof createHarness>>;

function totalsOf(view: ActiveView, name: string) {
  const envelope = view.envelopes.find((candidate) => candidate.name === name);
  return view.current.envelopes.find((totals) => totals.id === envelope?.id);
}

describe("one budget per currency over HTTP", () => {
  let db: Harness["db"];
  let send: Harness["send"];
  let seed: Harness["seed"];

  beforeEach(async () => {
    ({ db, send, seed } = await createHarness());
    const accounts = [
      ["aed-current", "checking", "AED", 1_000_000],
      ["usd-current", "checking", "USD", 500_000],
      ["aed-card", "credit_card", "AED", 0],
      ["usd-card", "credit_card", "USD", 0],
    ] as const;
    for (const [id, type, currency, openingBalanceMinor] of accounts) {
      await seed("/accounts", { id, name: id, type, currency, openingBalanceMinor });
    }
    await seed("/categories", { id: "groceries", name: "Groceries", kind: "expense" });
    await seed("/categories", { id: "rent", name: "Rent", kind: "expense" });
    const groceries = { kind: "expense", categoryId: "groceries" } as const;
    // The same Category spent from each currency's money and card.
    await seed("/transactions", {
      ...groceries,
      id: "aed-spend",
      accountId: "aed-current",
      amountMinor: 30_000,
      date: "2026-10-01",
    });
    await seed("/transactions", {
      ...groceries,
      id: "usd-spend",
      accountId: "usd-current",
      amountMinor: 7_000,
      date: "2026-10-02",
    });
    await seed("/transactions", {
      ...groceries,
      id: "aed-card-spend",
      accountId: "aed-card",
      amountMinor: 10_000,
      date: "2026-10-05",
    });
    await seed("/transactions", {
      ...groceries,
      id: "usd-card-spend",
      accountId: "usd-card",
      amountMinor: 2_000,
      date: "2026-10-05",
    });
    await seed("/transactions", {
      id: "usd-card-payment",
      kind: "transfer",
      accountId: "usd-current",
      toAccountId: "usd-card",
      amountMinor: 500,
      date: "2026-10-06",
    });
    const rent = {
      kind: "expense",
      categoryId: "rent",
      frequency: "month",
      timeZone: "Asia/Dubai",
    } as const;
    await seed("/recurring", {
      ...rent,
      id: "aed-rent",
      name: "AED rent",
      currency: "AED",
      accountId: "aed-current",
      amountMinor: 300_000,
      startDate: "2026-10-15",
    });
    await seed("/recurring", {
      ...rent,
      id: "usd-rent",
      name: "USD rent",
      currency: "USD",
      accountId: "usd-current",
      amountMinor: 100_000,
      startDate: "2026-10-20",
    });
  });

  function plan(currency: "AED" | "USD", groceriesMinor: number): V2BudgetActivateInput {
    return {
      currency,
      paydayRule: { kind: "day", day: 25 },
      fundingAccountIds: [currency === "AED" ? "aed-current" : "usd-current"],
      envelopes: [
        {
          name: "Groceries",
          group: "everyday",
          categoryId: "groceries",
          plannedMinor: groceriesMinor,
        },
        { name: "Rent", group: "bills", categoryId: "rent", plannedMinor: 100_000 },
      ],
    };
  }

  async function activateBoth() {
    expect((await send("POST", "/budget/activate", plan("AED", 100_000), "aed")).status).toBe(201);
    expect((await send("POST", "/budget/activate", plan("USD", 20_000), "usd")).status).toBe(201);
  }

  async function budgetIn(currency: string) {
    const read = await send("GET", `/budget?currency=${currency}`);
    expect(read.status).toBe(200);
    return read.body;
  }

  it("keeps funding, spending in a shared Category, and card reserve in each currency", async () => {
    await activateBoth();
    const aed = await budgetIn("AED");
    const usd = await budgetIn("USD");

    expect([aed.budget.currency, aed.fundingAccountIds]).toEqual(["AED", ["aed-current"]]);
    expect([usd.budget.currency, usd.fundingAccountIds]).toEqual(["USD", ["usd-current"]]);
    // Groceries is an envelope in both budgets; each counts only its own currency's spending.
    expect(totalsOf(aed, "Groceries")?.spentMinor).toBe(40_000);
    expect(totalsOf(usd, "Groceries")?.spentMinor).toBe(9_000);
    // AED card spend is unpaid; the USD card got 500 of its 2,000 back.
    expect(aed.current.cardReserveMinor).toBe(10_000);
    expect(usd.current.cardReserveMinor).toBe(1_500);
    // Not planned yet = own funding cash - own envelopes' Left - own card reserve.
    expect(aed.current.unassignedMinor).toBe(970_000 - (60_000 + 100_000) - 10_000);
    expect(usd.current.unassignedMinor).toBe(492_500 - (11_000 + 100_000) - 1_500);

    const list = await send<V2BudgetList>("GET", "/budgets");
    expect(list.status).toBe(200);
    expect(list.body).toEqual({
      items: [
        expect.objectContaining({
          currency: "AED",
          safeToSpendMinor: aed.current.safeToSpendMinor,
        }),
        expect.objectContaining({
          currency: "USD",
          safeToSpendMinor: usd.current.safeToSpendMinor,
        }),
      ],
      truncated: false,
    });
  });

  it("asks which budget once a ledger has two, and refuses unknown or malformed currencies", async () => {
    await activateBoth();
    const cases = [
      ["/budget", 422, "budget_currency_required"],
      ["/budget/activity", 422, "budget_currency_required"],
      ["/recurring/due?through=2026-10-31", 422, "budget_currency_required"],
      ["/budget?currency=EUR", 404, "budget_not_found"],
      ["/budget/activity?currency=EUR", 404, "budget_not_found"],
      ["/budget?currency=usd", 400, "invalid_currency"],
      ["/budget?currency=XQQ", 400, "invalid_currency"],
    ] as const;
    for (const [path, status, code] of cases) {
      const result = await send<ErrorBody>("GET", path);
      expect([path, result.status, result.body.error.code]).toEqual([path, status, code]);
    }
    const again = await send<ErrorBody>("POST", "/budget/activate", plan("USD", 1), "usd-again");
    expect([again.status, again.body.error.code]).toEqual([409, "budget_already_active"]);
  });

  it("refuses accounts in another currency on activation, payday settings, and big payments", async () => {
    expect((await send("POST", "/budget/activate", plan("AED", 100_000), "aed")).status).toBe(201);
    const mixed = await send<ErrorBody>(
      "POST",
      "/budget/activate",
      { ...plan("USD", 20_000), fundingAccountIds: ["usd-current", "aed-current"] },
      "mixed",
    );
    expect([mixed.status, mixed.body.error.code]).toEqual([422, "budget_currency_mismatch"]);

    expect((await send("POST", "/budget/activate", plan("USD", 20_000), "usd")).status).toBe(201);
    const defaultAccount = await send<ErrorBody>(
      "PATCH",
      "/budget?currency=USD",
      { defaultAccountId: "aed-current" },
      "default",
    );
    expect([defaultAccount.status, defaultAccount.body.error.code]).toEqual([
      422,
      "budget_currency_mismatch",
    ]);

    const trip = await send<ActiveView & { envelopeId: string }>(
      "POST",
      "/budget/envelopes?currency=USD",
      { name: "Trip", group: "saving", newCategory: { name: "Trip" }, targetMinor: 50_000 },
      "trip",
    );
    expect(trip.status).toBe(201);
    const paid = await send<ErrorBody>(
      "POST",
      `/budget/envelopes/${trip.body.envelopeId}/pay?currency=USD`,
      { amountMinor: 10_000, accountId: "aed-current", date: "2026-10-10" },
      "trip-pay",
    );
    expect([paid.status, paid.body.error.code]).toEqual([422, "budget_currency_mismatch"]);
    const tripSpend = await db.select().from(v2Transaction).where(eq(v2Transaction.note, "Trip"));
    expect(tripSpend).toEqual([]);
  });

  it("keeps assignments, envelopes, and activity inside the selected budget", async () => {
    await activateBoth();
    const aedBefore = await budgetIn("AED");
    const usdBefore = await budgetIn("USD");
    const usdGroceries = usdBefore.envelopes.find((envelope) => envelope.name === "Groceries");
    const aedGroceries = aedBefore.envelopes.find((envelope) => envelope.name === "Groceries");

    const moved = await send(
      "POST",
      "/budget/assignments?currency=USD",
      {
        items: [
          {
            fromEnvelopeId: null,
            toEnvelopeId: usdGroceries?.id ?? "",
            amountMinor: 5_000,
            reason: "plan",
          },
        ],
      },
      "usd-move",
    );
    expect(moved.status).toBe(201);
    expect(moved.body.current.unassignedMinor).toBe(usdBefore.current.unassignedMinor - 5_000);
    expect(await budgetIn("AED")).toEqual(aedBefore);

    // An AED envelope is not part of the USD budget.
    const crossed = await send<ErrorBody>(
      "POST",
      "/budget/assignments?currency=USD",
      {
        items: [
          {
            fromEnvelopeId: null,
            toEnvelopeId: aedGroceries?.id ?? "",
            amountMinor: 1,
            reason: "plan",
          },
        ],
      },
      "crossed",
    );
    expect([crossed.status, crossed.body.error.code]).toEqual([404, "envelope_not_found"]);
    const edited = await send<ErrorBody>(
      "PATCH",
      `/budget/envelopes/${aedGroceries?.id ?? ""}?currency=USD`,
      { name: "Food" },
      "edit-crossed",
    );
    expect([edited.status, edited.body.error.code]).toEqual([404, "envelope_not_found"]);

    const activity = async (currency: string) => {
      const result = await send<V2BudgetActivity>("GET", `/budget/activity?currency=${currency}`);
      expect(result.status).toBe(200);
      return result.body.items.map((item) => [item.toName, item.amountMinor]);
    };
    expect(await activity("USD")).toEqual(
      expect.arrayContaining([
        ["Groceries", 5_000],
        ["Groceries", 20_000],
        ["Rent", 100_000],
      ]),
    );
    expect(await activity("USD")).toHaveLength(3);
    expect(await activity("AED")).toEqual(
      expect.arrayContaining([
        ["Groceries", 100_000],
        ["Rent", 100_000],
      ]),
    );
    expect(await activity("AED")).toHaveLength(2);
  });

  it("gives each budget its own bill reminders and counts a paid bill in its currency only", async () => {
    const modes = async () =>
      Promise.all(
        ["aed-rent", "usd-rent"].map(async (id) => {
          const rule = await send<V2RecurringRule>("GET", `/recurring/${id}`);
          return rule.body.mode;
        }),
      );
    expect((await send("POST", "/budget/activate", plan("AED", 100_000), "aed")).status).toBe(201);
    // Activation flips only its own currency's Bills rules.
    expect(await modes()).toEqual(["remind", "auto_post"]);
    expect((await send("POST", "/budget/activate", plan("USD", 20_000), "usd")).status).toBe(201);
    expect(await modes()).toEqual(["remind", "remind"]);

    const due = async (currency: string) => {
      const result = await send<V2DueList>(
        "GET",
        `/recurring/due?through=2026-10-31&currency=${currency}`,
      );
      expect(result.status).toBe(200);
      return result.body.items.map((item) => [item.ruleId, item.scheduledDate]);
    };
    expect(await due("AED")).toEqual([["aed-rent", "2026-10-15"]]);
    expect(await due("USD")).toEqual([["usd-rent", "2026-10-20"]]);

    const paid = await send<V2RecordedOccurrence>(
      "POST",
      "/recurring/usd-rent/occurrences/2026-10-20/pay",
      { date: "2026-10-10" },
      "pay-usd-rent",
    );
    expect(paid.status).toBe(201);
    expect(await due("USD")).toEqual([]);
    expect(await due("AED")).toEqual([["aed-rent", "2026-10-15"]]);
    expect(totalsOf(await budgetIn("USD"), "Rent")?.spentMinor).toBe(100_000);
    expect(totalsOf(await budgetIn("AED"), "Rent")?.spentMinor).toBe(0);
  });

  it("reads setup facts for one currency only", async () => {
    const facts = await send<V2BudgetSetupFacts>(
      "GET",
      "/budget/setup-facts?payday=day:25&currency=USD",
    );
    expect(facts.status).toBe(200);
    expect(facts.body.accountBalances.map((row) => row.accountId).sort()).toEqual([
      "usd-card",
      "usd-current",
    ]);
    expect(
      facts.body.spendSincePeriodStart.map((row) => [row.accountId, row.amountMinor]).sort(),
    ).toEqual([
      ["usd-card", 2_000],
      ["usd-current", 7_000],
    ]);
    expect(facts.body.cardPaymentsSincePeriodStart).toEqual([
      { fromAccountId: "usd-current", toAccountId: "usd-card", amountMinor: 500 },
    ]);
    expect(facts.body.recurringExpenses.map((rule) => rule.ruleId)).toEqual(["usd-rent"]);
  });

  it("keeps a single-budget ledger working with and without ?currency=", async () => {
    // No currency in the body: the AED default, as the app sends today.
    const { currency: _currency, ...legacyPlan } = plan("AED", 100_000);
    expect((await send("POST", "/budget/activate", legacyPlan, "legacy")).status).toBe(201);
    const plain = await send("GET", "/budget");
    expect(plain.status).toBe(200);
    expect(plain.body.budget.currency).toBe("AED");
    expect(await budgetIn("AED")).toEqual(plain.body);
    const missing = await send<ErrorBody>("GET", "/budget?currency=USD");
    expect([missing.status, missing.body.error.code]).toEqual([404, "budget_not_found"]);
    const due = await send<V2DueList>("GET", "/recurring/due?through=2026-10-31");
    expect(due.body.items.map((item) => item.ruleId)).toEqual(["aed-rent"]);
  });
});

describe("migration 0020 on a budget created before it", () => {
  const LEDGER = "ledger-before-0020";

  /** Writes a one-budget ledger in the 0018/0019 shape: mappings have no budget_id yet. */
  async function seedBefore0020(file: string, client: PGlite) {
    if (!file.startsWith("0020_")) return;
    await client.exec(`
      INSERT INTO v2_ledger (id, owner_type, owner_id) VALUES ('${LEDGER}', 'guest', '${GUEST}');
      INSERT INTO v2_accounts (ledger_id, id, name, type, currency, opening_balance_minor, created_by, updated_by)
        VALUES ('${LEDGER}', 'current', 'Current', 'checking', 'AED', 500000, '${GUEST}', '${GUEST}');
      INSERT INTO v2_categories (ledger_id, id, name, kind, created_by, updated_by)
        VALUES ('${LEDGER}', 'groceries', 'Groceries', 'expense', '${GUEST}', '${GUEST}');
      INSERT INTO v2_budgets (ledger_id, id, currency, activation_period_start, created_by, updated_by)
        VALUES ('${LEDGER}', 'budget-aed', 'AED', '2026-09-25', '${GUEST}', '${GUEST}');
      INSERT INTO v2_budget_paydays (ledger_id, budget_id, effective_from, kind, day, created_by)
        VALUES ('${LEDGER}', 'budget-aed', '2026-09-25', 'day', 25, '${GUEST}');
      INSERT INTO v2_budget_funding_accounts (ledger_id, budget_id, account_id)
        VALUES ('${LEDGER}', 'budget-aed', 'current');
      INSERT INTO v2_envelopes (ledger_id, id, budget_id, name, "group", created_by, updated_by)
        VALUES ('${LEDGER}', 'env-groceries', 'budget-aed', 'Groceries', 'everyday', '${GUEST}', '${GUEST}');
      INSERT INTO v2_envelope_categories (ledger_id, envelope_id, category_id)
        VALUES ('${LEDGER}', 'env-groceries', 'groceries');
    `);
  }

  it("backfills the mapping's budget and serves the budget with and without ?currency=", async () => {
    const { db, send, seed } = await createHarness({ beforeMigration: seedBefore0020 });
    expect(await db.select().from(v2EnvelopeCategory)).toEqual([
      expect.objectContaining({ budgetId: "budget-aed", envelopeId: "env-groceries" }),
    ]);
    await seed("/transactions", {
      id: "spend",
      kind: "expense",
      accountId: "current",
      categoryId: "groceries",
      amountMinor: 4_000,
      date: "2026-10-01",
    });

    const plain = await send("GET", "/budget");
    expect(plain.status).toBe(200);
    expect(plain.body.budget.id).toBe("budget-aed");
    expect(totalsOf(plain.body, "Groceries")?.spentMinor).toBe(4_000);
    expect((await send("GET", "/budget?currency=AED")).body).toEqual(plain.body);
    // The backfilled mapping still holds the Category for this budget.
    const taken = await send<ErrorBody>(
      "POST",
      "/budget/envelopes",
      { name: "Food", group: "everyday", categoryId: "groceries" },
      "food",
    );
    expect([taken.status, taken.body.error.code]).toEqual([409, "category_already_mapped"]);
  });
});
