import { Hono } from "hono";
import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { v2GuestSession } from "@trove/db/schema/v2-identity";

import { createTestDb } from "../../test-support/db";
import type { V2BudgetActivateInput, V2BudgetUpdateInput, V2Principal } from "../contracts";
import {
  BudgetCategoryDuplicate,
  BudgetFundingInvalid,
  BudgetNotFound,
  BudgetStoreError,
  DueHorizonExceeded,
  EnvelopeNotFound,
  LedgerRefused,
  RecurringRuleAutoPosts,
  type BudgetFailure,
} from "../budget-errors";
import { httpFailure, runBudgetRoute } from "../budget-http";
import { createV2LedgerRoutes } from "../ledger-routes";
import {
  resolveV2LedgerContext,
  V2ApiError,
  type V2ErrorDetails,
  type V2LedgerContext,
} from "../shared";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;
type RestFailure = Exclude<BudgetFailure, BudgetStoreError>;

const GUEST = "guest-budget-http";
const NOW = new Date("2026-10-11T08:00:00Z");
const principal: V2Principal = { kind: "guest", guestSessionId: GUEST };

async function createLedger(): Promise<{ db: TestDb; ledger: V2LedgerContext }> {
  const db = await createTestDb({ householdLedgerMirror: false });
  await db.insert(v2GuestSession).values({
    id: GUEST,
    tokenHash: "guest-budget-http-token",
    clientKeyHash: "guest-budget-http-client",
    status: "active",
    expiresAt: new Date(Date.now() + 60_000),
  });
  return { db, ledger: await resolveV2LedgerContext(db, principal, { kind: "personal" }) };
}

describe("budget HTTP boundary", () => {
  it("maps budget failures to the REST status, code, message, and details", () => {
    const cases: readonly [RestFailure, number, string, string, V2ErrorDetails | undefined][] = [
      [new BudgetNotFound(), 404, "budget_not_found", "This ledger has no budget.", undefined],
      [
        new BudgetFundingInvalid({ accountId: "card", reason: "credit_card" }),
        422,
        "budget_funding_invalid",
        "A credit card can't fund a budget. Pick the accounts that hold your money.",
        { accountId: "card" },
      ],
      [
        new BudgetCategoryDuplicate({ categoryId: "rent" }),
        422,
        "budget_category_duplicate",
        "Two envelopes use the same Category. Merge them into one envelope.",
        { categoryId: "rent" },
      ],
      [
        new EnvelopeNotFound({ envelopeId: "gone", source: "item" }),
        404,
        "envelope_not_found",
        "An envelope was not found.",
        { envelopeId: "gone" },
      ],
      [
        new EnvelopeNotFound({ envelopeId: "gone", source: "path" }),
        404,
        "envelope_not_found",
        "This envelope was not found.",
        undefined,
      ],
      [
        new RecurringRuleAutoPosts(),
        409,
        "recurring_rule_auto_posts",
        "This Recurring Rule posts on its own. Switch it to reminders to mark it paid or skip it.",
        undefined,
      ],
      [
        new DueHorizonExceeded({ horizonDays: 366 }),
        422,
        "due_horizon_exceeded",
        "through must be within 366 days of today.",
        undefined,
      ],
    ];
    for (const [failure, status, code, message, details] of cases) {
      const error = httpFailure(failure);
      expect({ ...error, message: error.message }).toEqual({
        name: "V2ApiError",
        status,
        code,
        message,
        details,
      });
    }
  });

  describe("runBudgetRoute", () => {
    let ledger: V2LedgerContext;

    beforeEach(async () => {
      ({ ledger } = await createLedger());
    });

    it("passes a refusal of the reused V2 code through unchanged", async () => {
      const refusal = new V2ApiError(422, "account_not_found", "Account not found.");
      const program = Effect.fail(new LedgerRefused({ refusal }));
      await expect(runBudgetRoute(ledger, NOW, program)).rejects.toBe(refusal);
    });

    it("rethrows a database failure's cause and a defect as they were", async () => {
      const cause = new Error("connection reset");
      const storeFailure = Effect.fail(new BudgetStoreError({ operation: "budget.find", cause }));
      await expect(runBudgetRoute(ledger, NOW, storeFailure)).rejects.toBe(cause);

      const invalid = new z.ZodError([]);
      await expect(runBudgetRoute(ledger, NOW, Effect.die(invalid))).rejects.toBe(invalid);
    });
  });

  it("refuses an Idempotency-Key reused for another budget operation", async () => {
    const { db } = await createLedger();
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
    const send = async (
      method: string,
      path: string,
      body: V2BudgetActivateInput | V2BudgetUpdateInput,
    ) => {
      const response = await app.request(`http://test/api/v2${path}`, {
        method,
        headers: { "Content-Type": "application/json", "Idempotency-Key": "same-key" },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    const plan: V2BudgetActivateInput = {
      paydayRule: { kind: "day", day: 25 },
      openingCashMinor: 100_000,
      envelopes: [
        {
          name: "Groceries",
          group: "everyday",
          newCategory: { name: "Groceries" },
          plannedMinor: 50_000,
        },
      ],
    };

    expect((await send("POST", "/budget/activate", plan)).status).toBe(201);
    expect(await send("PATCH", "/budget", { paydayReminder: true })).toEqual({
      status: 409,
      body: { error: { code: "idempotency_key_reused" } },
    });
  });
});
