import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { v2Transaction } from "@trove/db/schema/v2-ledger";

import { createTestDb } from "../../test-support/db";
import type {
  V2AccountCreateInput,
  V2BudgetActivateInput,
  V2BudgetView,
  V2CategoryCreateInput,
  V2EnvelopeCreateInput,
  V2EnvelopePaid,
  V2EnvelopePayInput,
  V2Principal,
} from "../contracts";
import { createV2LedgerRoutes } from "../ledger-routes";
import { V2ApiError } from "../shared";

type RequestBody =
  | V2AccountCreateInput
  | V2CategoryCreateInput
  | V2BudgetActivateInput
  | V2EnvelopeCreateInput
  | V2EnvelopePayInput;
type ActiveView = Extract<V2BudgetView, { readonly budget: object }>;

// 2026-10-11 in Dubai. Payday 25 -> current period 2026-09-25..2026-10-24.
const NOW = new Date("2026-10-11T08:00:00Z");
const GUEST = "guest-big-payments";

async function createHarness() {
  const db = await createTestDb({ householdLedgerMirror: false });
  await db.insert(v2GuestSession).values({
    id: GUEST,
    tokenHash: "guest-big-payments-token",
    clientKeyHash: "guest-big-payments-client",
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
  return { db, send };
}

const plan: V2BudgetActivateInput = {
  paydayRule: { kind: "day", day: 25 },
  usualSalaryMinor: 1_500_000,
  fundingAccountIds: ["current"],
  envelopes: [
    { name: "Groceries", group: "everyday", categoryId: "groceries", plannedMinor: 100_000 },
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

describe("V2 big payments over HTTP", () => {
  let db: Awaited<ReturnType<typeof createHarness>>["db"];
  let send: Awaited<ReturnType<typeof createHarness>>["send"];

  beforeEach(async () => {
    ({ db, send } = await createHarness());
    await send("POST", "/accounts", {
      id: "current",
      name: "Current",
      type: "checking",
      currency: "AED",
      openingBalanceMinor: 1_000_000,
    });
    await send("POST", "/categories", { id: "groceries", name: "Groceries", kind: "expense" });
    expect((await send("POST", "/budget/activate", plan, "activate")).status).toBe(201);
  });

  const envelopeNamed = (view: ActiveView, name: string) => {
    const envelope = view.envelopes.find((candidate) => candidate.name === name);
    if (!envelope) throw new Error(`No envelope named ${name}`);
    const totals = view.current.envelopes.find((candidate) => candidate.id === envelope.id);
    if (!totals) throw new Error(`No totals for ${name}`);
    return { envelope, totals };
  };
  const pay = (id: string, body: V2EnvelopePayInput, key = `pay-${id}-${body.amountMinor}`) =>
    send<V2EnvelopePaid>("POST", `/budget/envelopes/${id}/pay`, body, key);

  it("suggests a per-payday amount from the envelope's Left and the paydays up to the due date", async () => {
    const view = (await send("GET", "/budget")).body;
    const { envelope } = envelopeNamed(view, "Ramadan & Eid");
    // Left 70,000 counts as set aside. Starts after today: Oct 25, Nov 25, Dec 25, Jan 25, Feb 25.
    // ceil((300,000 - 70,000) / 5) = 46,000.
    expect(envelope).toMatchObject({ savingPerPaydayMinor: 46_000, paydaysLeft: 5 });
    expect(envelope.shortBeforePaydayMinor).toBeUndefined();
    expect(envelopeNamed(view, "Groceries").envelope.savingPerPaydayMinor).toBeUndefined();
  });

  it("warns when the due date falls before the next payday and Left is short", async () => {
    const created = await send("POST", "/budget/envelopes", {
      name: "Rent cheque",
      group: "saving",
      newCategory: { name: "Rent cheque" },
      plannedMinor: 100_000,
      targetMinor: 500_000,
      dueDate: "2026-10-20",
      repeat: "once",
    });
    expect(created.status).toBe(201);
    const { envelope } = envelopeNamed(created.body, "Rent cheque");
    expect(envelope).toMatchObject({
      shortBeforePaydayMinor: 400_000,
      paydaysLeft: 1,
      savingPerPaydayMinor: 400_000,
    });
  });

  it("paying with enough set aside leaves Safe to spend unchanged and advances a repeating due date", async () => {
    const before = (await send("GET", "/budget")).body;
    const { envelope } = envelopeNamed(before, "Ramadan & Eid");

    const paid = await pay(envelope.id, {
      amountMinor: 60_000,
      accountId: "current",
      date: "2026-10-11",
    });
    expect(paid.status).toBe(201);
    expect(paid.body.current.safeToSpendMinor).toBe(before.current.safeToSpendMinor);
    expect(paid.body.current.unassignedMinor).toBe(before.current.unassignedMinor);
    const after = envelopeNamed(paid.body, "Ramadan & Eid");
    expect(after.totals).toMatchObject({ spentMinor: 60_000, leftMinor: 10_000 });
    // Yearly: same target, due date one year on.
    expect(after.envelope).toMatchObject({
      targetMinor: 300_000,
      dueDate: "2028-03-01",
      repeat: "yearly",
    });

    const rows = await db
      .select()
      .from(v2Transaction)
      .where(eq(v2Transaction.id, paid.body.transactionId));
    expect(rows[0]).toMatchObject({ kind: "expense", amountMinor: 60_000, accountId: "current" });
  });

  it("shows a shortfall as the envelope's negative Left", async () => {
    const before = (await send("GET", "/budget")).body;
    const { envelope } = envelopeNamed(before, "Ramadan & Eid");
    const paid = await pay(envelope.id, {
      amountMinor: 100_000,
      accountId: "current",
      date: "2026-10-11",
    });
    expect(envelopeNamed(paid.body, "Ramadan & Eid").totals.leftMinor).toBe(-30_000);
    // Saving-for is outside Safe to spend; cash and Left fell together.
    expect(paid.body.current.safeToSpendMinor).toBe(before.current.safeToSpendMinor);
  });

  it("clears the target of a one-off payment and replays an idempotent retry once", async () => {
    const created = await send("POST", "/budget/envelopes", {
      name: "School fees",
      group: "saving",
      newCategory: { name: "School fees" },
      plannedMinor: 80_000,
      targetMinor: 80_000,
      dueDate: "2026-10-20",
      repeat: "once",
    });
    const { envelope } = envelopeNamed(created.body, "School fees");
    const body = { amountMinor: 80_000, accountId: "current", date: "2026-10-12" };

    const first = await pay(envelope.id, body, "pay-school");
    const replay = await pay(envelope.id, body, "pay-school");
    expect(replay.body.transactionId).toBe(first.body.transactionId);
    expect(envelopeNamed(first.body, "School fees").envelope).toMatchObject({
      targetMinor: null,
      dueDate: null,
      repeat: null,
    });
    const rows = await db.select().from(v2Transaction).where(eq(v2Transaction.amountMinor, 80_000));
    expect(rows).toHaveLength(1);
  });

  it("refuses envelopes that are not Saving-for", async () => {
    const view = (await send("GET", "/budget")).body;
    const { envelope } = envelopeNamed(view, "Groceries");
    const refused = await send<{ error: { code: string } }>(
      "POST",
      `/budget/envelopes/${envelope.id}/pay`,
      {
        amountMinor: 1_000,
        accountId: "current",
        date: "2026-10-11",
      },
    );
    expect(refused.status).toBe(422);
    expect(refused.body.error.code).toBe("envelope_not_saving_for");
  });
});
