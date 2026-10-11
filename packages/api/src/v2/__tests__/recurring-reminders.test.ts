import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { v2RecurringOccurrence, v2Transaction } from "@trove/db/schema/v2-ledger";

import { createTestDb } from "../../test-support/db";
import type {
  V2AccountCreateInput,
  V2BudgetActivateInput,
  V2CategoryCreateInput,
  V2DueList,
  V2Principal,
  V2RecordedOccurrence,
  V2RecurringCreateInput,
  V2RecurringPayInput,
  V2RecurringRule,
} from "../contracts";
import { createV2LedgerRoutes } from "../ledger-routes";
import { settleV2DueRules } from "../recurring";
import { V2ApiError } from "../shared";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;
type RequestBody =
  | V2AccountCreateInput
  | V2CategoryCreateInput
  | V2RecurringCreateInput
  | V2RecurringPayInput
  | V2BudgetActivateInput;
interface ErrorBody {
  readonly error: { readonly code: string };
}

// 2026-10-11 in Dubai.
const NOW = new Date("2026-10-11T08:00:00Z");
const GUEST = "guest-reminders";

/** An app over a fresh PGlite DB with a guest principal and a fixed clock. */
async function createHarness() {
  const db = await createTestDb({ householdLedgerMirror: false });
  await db.insert(v2GuestSession).values({
    id: GUEST,
    tokenHash: "guest-reminders-token",
    clientKeyHash: "guest-reminders-client",
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

  async function send<T>(method: string, path: string, body?: RequestBody, key?: string) {
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

const monthly = {
  kind: "expense",
  currency: "AED",
  accountId: "current",
  frequency: "month",
  timeZone: "Asia/Dubai",
} as const;

describe("V2 recurring reminders over HTTP", () => {
  let db: TestDb;
  let send: Awaited<ReturnType<typeof createHarness>>["send"];
  let seed: Awaited<ReturnType<typeof createHarness>>["seed"];

  beforeEach(async () => {
    ({ db, send, seed } = await createHarness());
    await seed("/accounts", {
      id: "current",
      name: "Current",
      type: "checking",
      currency: "AED",
      openingBalanceMinor: 1_000_000,
    });
    await seed("/accounts", { id: "savings", name: "Savings", type: "savings", currency: "AED" });
    await seed("/categories", { id: "rent", name: "Rent", kind: "expense" });
    await seed("/categories", { id: "gym", name: "Gym", kind: "expense" });
    await seed("/categories", { id: "groceries", name: "Groceries", kind: "expense" });
  });

  async function seedRentReminder() {
    await seed("/recurring", {
      ...monthly,
      id: "rent-rule",
      name: "Rent",
      categoryId: "rent",
      amountMinor: 500_000,
      startDate: "2026-09-01",
      mode: "remind",
    });
  }

  async function ruleTransactions(ruleId: string) {
    return db.select().from(v2Transaction).where(eq(v2Transaction.recurringRuleId, ruleId));
  }

  async function due() {
    const result = await send<V2DueList>("GET", "/recurring/due?through=2026-11-05");
    expect(result.status).toBe(200);
    return result.body.items.map((item) => [item.ruleId, item.scheduledDate, item.overdue]);
  }

  it("the cron skips remind rules and still posts auto_post rules", async () => {
    await seedRentReminder();
    await seed("/recurring", {
      ...monthly,
      id: "gym-rule",
      name: "Gym",
      categoryId: "gym",
      amountMinor: 30_000,
      startDate: "2026-10-01",
    });

    const summary = await settleV2DueRules(db, NOW);
    const manual = await send<{ generatedCount: number }>("POST", "/recurring/rent-rule/settle");

    expect(summary.generatedCount).toBe(1);
    expect(manual.body.generatedCount).toBe(0);
    expect(await ruleTransactions("rent-rule")).toEqual([]);
    expect((await ruleTransactions("gym-rule")).map((row) => [row.date, row.amountMinor])).toEqual([
      ["2026-10-01", 30_000],
    ]);
    // An overdue reminder survives the cron and stays due until paid or skipped.
    expect(await due()).toEqual([
      ["rent-rule", "2026-09-01", true],
      ["rent-rule", "2026-10-01", true],
      ["rent-rule", "2026-11-01", false],
    ]);
  });

  it("Mark paid posts one transaction with the confirmed values and replays its key", async () => {
    await seedRentReminder();
    const confirmed = { amountMinor: 480_000, accountId: "savings", date: "2026-10-03" };

    const paid = await send<V2RecordedOccurrence>(
      "POST",
      "/recurring/rent-rule/occurrences/2026-10-01/pay",
      confirmed,
      "pay-oct",
    );
    const replay = await send<V2RecordedOccurrence>(
      "POST",
      "/recurring/rent-rule/occurrences/2026-10-01/pay",
      confirmed,
      "pay-oct",
    );
    const again = await send<ErrorBody>(
      "POST",
      "/recurring/rent-rule/occurrences/2026-10-01/pay",
      {},
      "pay-oct-again",
    );
    const offSchedule = await send<ErrorBody>(
      "POST",
      "/recurring/rent-rule/occurrences/2026-10-02/pay",
      {},
      "pay-off-schedule",
    );

    expect(paid.status).toBe(201);
    expect(paid.body).toMatchObject({ scheduledDate: "2026-10-01", status: "settled" });
    expect(replay).toEqual(paid);
    expect([again.status, again.body.error.code]).toEqual([409, "occurrence_already_paid"]);
    expect([offSchedule.status, offSchedule.body.error.code]).toEqual([
      422,
      "occurrence_not_scheduled",
    ]);
    const posted = await ruleTransactions("rent-rule");
    expect(
      posted.map((row) => [row.id, row.amountMinor, row.accountId, row.date, row.categoryId]),
    ).toEqual([[paid.body.transactionId, 480_000, "savings", "2026-10-03", "rent"]]);
    // The override was this time only.
    const rule = await send<V2RecurringRule>("GET", "/recurring/rent-rule");
    expect([rule.body.amountMinor, rule.body.accountId]).toEqual([500_000, "current"]);
    expect(await due()).toEqual([
      ["rent-rule", "2026-09-01", true],
      ["rent-rule", "2026-11-01", false],
    ]);
  });

  it("Skip records the occurrence without a transaction and removes it from Due", async () => {
    await seedRentReminder();

    const skipped = await send<V2RecordedOccurrence>(
      "POST",
      "/recurring/rent-rule/occurrences/2026-09-01/skip",
      undefined,
      "skip-sep",
    );
    const payAfterSkip = await send<ErrorBody>(
      "POST",
      "/recurring/rent-rule/occurrences/2026-09-01/pay",
      {},
      "pay-sep",
    );

    expect(skipped.status).toBe(201);
    expect(skipped.body).toEqual({
      ruleId: "rent-rule",
      scheduledDate: "2026-09-01",
      status: "skipped",
      transactionId: null,
    });
    expect([payAfterSkip.status, payAfterSkip.body.error.code]).toEqual([
      409,
      "occurrence_already_skipped",
    ]);
    expect(await ruleTransactions("rent-rule")).toEqual([]);
    const occurrences = await db
      .select({ status: v2RecurringOccurrence.status, txn: v2RecurringOccurrence.transactionId })
      .from(v2RecurringOccurrence)
      .where(and(eq(v2RecurringOccurrence.ruleId, "rent-rule")));
    expect(occurrences).toEqual([{ status: "skipped", txn: null }]);
    expect(await due()).toEqual([
      ["rent-rule", "2026-10-01", true],
      ["rent-rule", "2026-11-01", false],
    ]);
  });

  it("budget activation switches a Bills rule to remind and leaves other rules posting", async () => {
    const future = { ...monthly, startDate: "2026-11-01" } as const;
    await seed("/recurring", {
      ...future,
      id: "rent-rule",
      name: "Rent",
      categoryId: "rent",
      amountMinor: 500_000,
    });
    await seed("/recurring", {
      ...future,
      id: "groceries-rule",
      name: "Groceries",
      categoryId: "groceries",
      amountMinor: 50_000,
    });

    const activated = await send(
      "POST",
      "/budget/activate",
      {
        paydayRule: { kind: "day", day: 25 },
        fundingAccountIds: ["current"],
        envelopes: [
          { name: "Rent", group: "bills", categoryId: "rent", plannedMinor: 500_000 },
          { name: "Groceries", group: "everyday", categoryId: "groceries", plannedMinor: 100_000 },
        ],
      },
      "activate",
    );

    expect(activated.status).toBe(201);
    const rent = await send<V2RecurringRule>("GET", "/recurring/rent-rule");
    const groceries = await send<V2RecurringRule>("GET", "/recurring/groceries-rule");
    expect([rent.body.mode, rent.body.revision]).toEqual(["remind", 2]);
    expect([groceries.body.mode, groceries.body.revision]).toEqual(["auto_post", 1]);
  });
});
