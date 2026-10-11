import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb } from "../../test-support/db";
import { createFakeDirectory } from "../../test-support/fake-directory";
import type {
  V2AccountCreateInput,
  V2AssignmentsCreateInput,
  V2BudgetActivateInput,
  V2BudgetActivity,
  V2BudgetUpdateInput,
  V2BudgetView,
  V2CategoryCreateInput,
  V2EnvelopeCreateInput,
  V2EnvelopePaid,
  V2EnvelopePayInput,
  V2EnvelopeUpdateInput,
  V2Principal,
  V2TransactionCreateInput,
} from "../contracts";
import { v2AuthErrorResponse } from "../auth";
import {
  authorizeV2Household,
  createV2Household,
  listV2Households,
  type V2HouseholdDeps,
} from "../households";
import { createV2LedgerRoutes } from "../ledger-routes";
import { V2ApiError } from "../shared";

type RequestBody =
  | V2AccountCreateInput
  | V2CategoryCreateInput
  | V2TransactionCreateInput
  | V2BudgetActivateInput
  | V2BudgetUpdateInput
  | V2EnvelopeCreateInput
  | V2EnvelopeUpdateInput
  | V2EnvelopePayInput
  | V2AssignmentsCreateInput;
type ActiveView = Extract<V2BudgetView, { readonly budget: object }>;
interface ErrorBody {
  readonly error: { readonly code: string };
}

// 2026-10-11 in Dubai. Payday 25 -> current period 2026-09-25..2026-10-24.
const NOW = new Date("2026-10-11T08:00:00Z");

const person = (id: string, name: string) =>
  ({
    kind: "user",
    userId: id,
    workosUserId: id,
    email: `${id}@example.com`,
    name,
  }) as const satisfies V2Principal;
const ALICE = person("user_alice", "Alice");
const BOB = person("user_bob", "Bob");
const CARLA = person("user_carla", "Carla");
const PEOPLE = { alice: ALICE, bob: BOB, carla: CARLA };
type Who = keyof typeof PEOPLE;

const plan: V2BudgetActivateInput = {
  paydayRule: { kind: "day", day: 25 },
  fundingAccountIds: ["shared"],
  envelopes: [
    { name: "Groceries", group: "everyday", categoryId: "groceries", plannedMinor: 100_000 },
    { name: "Fun", group: "everyday", newCategory: { name: "Fun" }, plannedMinor: 20_000 },
    {
      name: "School fees",
      group: "saving",
      newCategory: { name: "School fees" },
      plannedMinor: 50_000,
      targetMinor: 50_000,
      dueDate: "2026-12-01",
      repeat: "once",
    },
  ],
};

/** Real household authorization over a fake WorkOS directory: Alice admin, Bob member, Carla viewer. */
async function createHarness() {
  const db = await createTestDb({ householdLedgerMirror: false });
  const directory = createFakeDirectory();
  const deps: V2HouseholdDeps = { db, directory, now: () => NOW };
  for (const user of [ALICE, BOB, CARLA]) {
    directory.seedUser({ id: user.userId, ...user });
  }
  const home = await createV2Household(deps, {
    actor: ALICE,
    name: "Home",
    requestId: "11111111-1111-4111-8111-111111111111",
  });
  directory.seedMembership({
    organizationId: home.householdId,
    userId: BOB.userId,
    roleSlug: "member",
  });
  directory.seedMembership({
    organizationId: home.householdId,
    userId: CARLA.userId,
    roleSlug: "viewer",
  });
  await listV2Households(deps, BOB);
  await listV2Households(deps, CARLA);

  const app = new Hono();
  // Mirrors createV2Api: V2ApiError and auth errors surface through onError.
  app.onError((error) => {
    if (error instanceof V2ApiError) {
      return Response.json({ error: { code: error.code } }, { status: error.status });
    }
    const response = v2AuthErrorResponse(error);
    return Response.json(response.body, { status: response.status });
  });
  app.route(
    "/api/v2",
    createV2LedgerRoutes({
      db,
      now: () => NOW,
      getPrincipal: async (context) => {
        const who = context.req.header("x-test-user");
        const found = Object.entries(PEOPLE).find(([name]) => name === who);
        if (!found) throw new Error("Missing x-test-user header.");
        return found[1];
      },
      authorizeHousehold: async (principal, householdId, access) => {
        if (principal.kind !== "user") throw new Error("Only users in these tests.");
        const { role } = await authorizeV2Household(deps, {
          userId: principal.userId,
          householdId,
          write: access === "write",
        });
        return { role };
      },
    }),
  );

  /** `scope` "household" targets the shared ledger; "personal" the caller's own. */
  async function send<T = ActiveView>(
    who: Who,
    method: string,
    path: string,
    body?: RequestBody,
    scope: "household" | "personal" = "household",
  ) {
    const query = scope === "household" ? `scope=household&householdId=${home.householdId}` : "";
    const url = `http://test/api/v2${path}${path.includes("?") ? "&" : "?"}${query}`;
    const response = await app.request(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-test-user": who,
        "Idempotency-Key": `${who}-${method}-${path}-${Math.random()}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // SAFETY: every V2 route answers JSON; each test asserts the status before relying on T.
    return { status: response.status, body: (await response.json()) as T };
  }
  return { send };
}

describe("V2 household budget roles over HTTP", () => {
  let send: Awaited<ReturnType<typeof createHarness>>["send"];

  beforeEach(async () => {
    ({ send } = await createHarness());
    await send("alice", "POST", "/accounts", {
      id: "shared",
      name: "Shared",
      type: "checking",
      currency: "AED",
      openingBalanceMinor: 1_000_000,
    });
    await send("alice", "POST", "/categories", {
      id: "groceries",
      name: "Groceries",
      kind: "expense",
    });
  });

  const idOf = (view: ActiveView, name: string) => {
    const envelope = view.envelopes.find((candidate) => candidate.name === name);
    if (!envelope) throw new Error(`No envelope named ${name}`);
    return envelope.id;
  };
  const activate = async () => (await send("alice", "POST", "/budget/activate", plan)).body;

  it("lets only an admin activate and change the plan; a member gets a clear 403", async () => {
    const refused = await send<ErrorBody>("bob", "POST", "/budget/activate", plan);
    expect(refused.status).toBe(403);
    expect(refused.body.error.code).toBe("budget_role_forbidden");

    const view = await activate();
    const forbidden = async (response: Promise<{ status: number; body: ErrorBody }>) => {
      const { status, body } = await response;
      expect({ status, code: body.error.code }).toEqual({
        status: 403,
        code: "budget_role_forbidden",
      });
    };
    await forbidden(
      send<ErrorBody>("bob", "PATCH", "/budget", { paydayRule: { kind: "day", day: 1 } }),
    );
    await forbidden(
      send<ErrorBody>("bob", "POST", "/budget/envelopes", {
        name: "Gifts",
        group: "everyday",
        newCategory: { name: "Gifts" },
      }),
    );
    await forbidden(
      send<ErrorBody>("bob", "PATCH", `/budget/envelopes/${idOf(view, "Fun")}`, { name: "Treats" }),
    );

    const edited = await send("alice", "PATCH", `/budget/envelopes/${idOf(view, "Fun")}`, {
      name: "Treats",
    });
    expect(edited.status).toBe(200);
  });

  it("lets a member add spending, move money, and mark a big payment paid", async () => {
    const view = await activate();
    const spent = await send("bob", "POST", "/transactions", {
      kind: "expense",
      accountId: "shared",
      categoryId: "groceries",
      amountMinor: 5_000,
      date: "2026-10-10",
    });
    expect(spent.status).toBe(201);

    const moved = await send("bob", "POST", "/budget/assignments", {
      items: [
        {
          fromEnvelopeId: idOf(view, "Groceries"),
          toEnvelopeId: idOf(view, "Fun"),
          amountMinor: 10_000,
          reason: "move",
        },
      ],
    });
    expect(moved.status).toBe(201);

    const paid = await send<V2EnvelopePaid>(
      "bob",
      "POST",
      `/budget/envelopes/${idOf(view, "School fees")}/pay`,
      { amountMinor: 50_000, accountId: "shared", date: "2026-10-11" },
    );
    expect(paid.status).toBe(201);
  });

  it("lets a viewer read the budget but refuses every write", async () => {
    const view = await activate();
    expect((await send("carla", "GET", "/budget")).status).toBe(200);

    const moved = await send<ErrorBody>("carla", "POST", "/budget/assignments", {
      items: [
        {
          fromEnvelopeId: idOf(view, "Groceries"),
          toEnvelopeId: idOf(view, "Fun"),
          amountMinor: 1_000,
          reason: "move",
        },
      ],
    });
    expect(moved.status).toBe(403);
    expect(moved.body.error.code).toBe("household_write_required");
    expect((await send("carla", "GET", "/budget/activity")).status).toBe(200);
  });

  it("does not restrict a personal ledger", async () => {
    await send(
      "bob",
      "POST",
      "/accounts",
      {
        id: "mine",
        name: "Mine",
        type: "checking",
        currency: "AED",
        openingBalanceMinor: 500_000,
      },
      "personal",
    );
    const activated = await send(
      "bob",
      "POST",
      "/budget/activate",
      {
        ...plan,
        fundingAccountIds: ["mine"],
        envelopes: [
          { name: "Fun", group: "everyday", newCategory: { name: "Fun" }, plannedMinor: 1_000 },
        ],
      },
      "personal",
    );
    expect(activated.status).toBe(201);
    const created = await send(
      "bob",
      "POST",
      "/budget/envelopes",
      { name: "Gifts", group: "everyday", newCategory: { name: "Gifts" } },
      "personal",
    );
    expect(created.status).toBe(201);
  });

  it("lists who moved money, newest first and bounded", async () => {
    const view = await activate();
    await send("bob", "POST", "/budget/assignments", {
      items: [
        {
          fromEnvelopeId: idOf(view, "Groceries"),
          toEnvelopeId: idOf(view, "Fun"),
          amountMinor: 10_000,
          reason: "move",
        },
      ],
    });

    const activity = await send<V2BudgetActivity>("carla", "GET", "/budget/activity");
    expect(activity.status).toBe(200);
    expect(activity.body.items[0]).toMatchObject({
      createdBy: BOB.userId,
      createdByName: "Bob",
      fromName: "Groceries",
      toName: "Fun",
      amountMinor: 10_000,
      reason: "move",
    });
    // Activation's plan rows are Alice's, from Not planned yet.
    const plans = activity.body.items.slice(1);
    expect(plans).toHaveLength(3);
    expect(plans.every((item) => item.createdByName === "Alice" && item.fromName === null)).toBe(
      true,
    );

    const one = await send<V2BudgetActivity>("alice", "GET", "/budget/activity?limit=1");
    expect(one.body.items).toHaveLength(1);
    expect((await send<ErrorBody>("alice", "GET", "/budget/activity?limit=0")).status).toBe(400);
    expect((await send<ErrorBody>("alice", "GET", "/budget/activity?limit=51")).status).toBe(400);
  });
});
