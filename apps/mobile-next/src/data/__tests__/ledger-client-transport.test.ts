interface CapturedRequest {
  readonly url: URL;
  readonly headers: Headers;
  readonly method: string;
}

const household = { kind: "household" as const, householdId: "household-1" };
const account = {
  id: "account-1",
  ledgerId: "household:household-1",
  name: "Checking",
  type: "checking" as const,
  currency: "USD",
  openingBalanceMinor: 0,
  balanceMinor: 0,
  archived: false,
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};
const category = {
  id: "category-1",
  ledgerId: "household:household-1",
  name: "Food",
  kind: "expense" as const,
  color: "#4a8f69",
  icon: "receipt",
  parentId: null,
  sortOrder: 0,
  archived: false,
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};
const transaction = {
  id: "transaction-1",
  ledgerId: "household:household-1",
  accountId: "account-1",
  categoryId: null,
  toAccountId: null,
  kind: "expense" as const,
  amountMinor: 100,
  currency: "USD",
  date: "2026-09-21",
  note: "Coffee",
  recurringRuleId: null,
  version: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};
const recurring = {
  id: "recurring-1",
  ledgerId: "household:household-1",
  name: "Rent",
  accountId: "account-1",
  categoryId: null,
  toAccountId: null,
  kind: "expense" as const,
  amountMinor: 100,
  currency: "USD",
  note: "",
  frequency: "month" as const,
  intervalCount: 1,
  startDate: "2026-09-21",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
  lifecycle: "active" as const,
  health: "ready" as const,
  attentionReasons: [],
  eligibilityFloor: "2026-09-21",
  revision: 1,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};

describe("V2 ledger mutation transport", () => {
  let ledgerClient: typeof import("@/data/ledger-client").ledgerClient;
  let setApiFetch: typeof import("@/data/http").setApiFetch;
  let changeRecurringLifecycle: typeof import("@/data/recurring-lifecycle").changeRecurringLifecycle;
  const requests: CapturedRequest[] = [];

  beforeAll(async () => {
    process.env.EXPO_PUBLIC_API_URL = "http://127.0.0.1:3012/api/v2";
    const testFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = new URL(input.toString());
      const headers = new Headers(init?.headers);
      requests.push({ url, headers, method: init?.method ?? "GET" });
      if (init?.method === "DELETE") return new Response(null, { status: 204 });
      const payload = url.pathname.includes("/accounts")
        ? account
        : url.pathname.includes("/categories")
          ? category
          : url.pathname.includes("/transactions")
            ? transaction
            : recurring;
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    jest.isolateModules(() => {
      const http: typeof import("@/data/http") = require("@/data/http");
      const loaded: typeof import("@/data/ledger-client") = require("@/data/ledger-client");
      setApiFetch = http.setApiFetch;
      ledgerClient = loaded.ledgerClient;
      const lifecycle: typeof import("@/data/recurring-lifecycle") = require("@/data/recurring-lifecycle");
      changeRecurringLifecycle = lifecycle.changeRecurringLifecycle;
    });
    setApiFetch(testFetch);
  });

  it("scopes every supported mutation and forwards the logical retry key", async () => {
    await ledgerClient.accounts.create(
      household,
      { name: "Checking", type: "checking", currency: "USD", openingBalanceMinor: 0 },
      { requestKey: "account-create-key" },
    );
    await ledgerClient.accounts.update(household, "account-1", { name: "Updated" }, { version: 1 });
    await ledgerClient.accounts.remove(household, "account-1", 1);
    await ledgerClient.categories.create(household, { name: "Food", kind: "expense" });
    await ledgerClient.categories.update(
      household,
      "category-1",
      { name: "Updated" },
      { version: 1 },
    );
    await ledgerClient.categories.remove(household, "category-1", 1);
    await ledgerClient.transactions.create(household, {
      accountId: "account-1",
      kind: "expense",
      amountMinor: 100,
      date: "2026-09-21",
      note: "Coffee",
    });
    await ledgerClient.transactions.update(
      household,
      "transaction-1",
      { note: "Updated" },
      { version: 1 },
    );
    await ledgerClient.transactions.remove(household, "transaction-1", 1);
    await ledgerClient.recurring.create(household, {
      name: "Rent",
      accountId: "account-1",
      kind: "expense",
      amountMinor: 100,
      currency: "USD",
      frequency: "month",
      intervalCount: 1,
      startDate: "2026-09-21",
      timeZone: "Asia/Dubai",
    });
    await ledgerClient.recurring.update(
      household,
      "recurring-1",
      { lifecycle: "paused" },
      { version: 1 },
    );

    expect(requests).toHaveLength(11);
    for (const request of requests) {
      expect(request.url.searchParams.get("scope")).toBe("household");
      expect(request.url.searchParams.get("householdId")).toBe("household-1");
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
    }
    expect(requests[0]?.headers.get("Idempotency-Key")).toBe("account-create-key");
    setApiFetch(null);
  });

  it("uses the latest settlement revision for a lifecycle-only change", async () => {
    const calls: RequestInit[] = [];
    setApiFetch(async (_input, init) => {
      calls.push(init ?? {});
      const updated = init?.method === "PATCH";
      return new Response(
        JSON.stringify({
          ...recurring,
          revision: updated ? 8 : 7,
          lifecycle: updated ? "paused" : "active",
        }),
        { status: 200 },
      );
    });
    const result = await changeRecurringLifecycle(household, recurring.id, "active", "paused");
    expect(result.lifecycle).toBe("paused");
    expect(calls).toHaveLength(2);
    expect(new Headers(calls[1]?.headers).get("If-Match")).toBe("7");
    expect(calls[1]?.body).toBe(JSON.stringify({ lifecycle: "paused" }));
    setApiFetch(null);
  });

  it("does not reverse a concurrent archive while trying to pause", async () => {
    const methods: string[] = [];
    setApiFetch(async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return new Response(JSON.stringify({ ...recurring, revision: 9, lifecycle: "archived" }), {
        status: 200,
      });
    });
    await expect(
      changeRecurringLifecycle(household, recurring.id, "active", "paused"),
    ).rejects.toThrow("Review its current state");
    expect(methods).toEqual(["GET"]);
    setApiFetch(null);
  });

  it("treats a previously completed lifecycle request as success", async () => {
    const methods: string[] = [];
    setApiFetch(async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return new Response(JSON.stringify({ ...recurring, revision: 8, lifecycle: "paused" }), {
        status: 200,
      });
    });
    await expect(
      changeRecurringLifecycle(household, recurring.id, "active", "paused"),
    ).resolves.toMatchObject({ lifecycle: "paused" });
    expect(methods).toEqual(["GET"]);
    setApiFetch(null);
  });
});
