import type { V2Page, V2Transaction, V2TransactionSummary } from "@trove/api/v2/contracts";

import { normalizeTransactionFilters } from "@/data/transaction-list-keys";

const MISSING = new URL("http://missing.invalid");

describe("V2 Transaction list transport", () => {
  let ledgerClient: typeof import("@/data/ledger-client").ledgerClient;
  let setApiFetch: typeof import("@/data/http").setApiFetch;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_URL = "http://127.0.0.1:3012/api/v2";
    jest.isolateModules(() => {
      const http: typeof import("@/data/http") = require("@/data/http");
      const loaded: typeof import("@/data/ledger-client") = require("@/data/ledger-client");
      setApiFetch = http.setApiFetch;
      ledgerClient = loaded.ledgerClient;
    });
  });

  afterEach(() => setApiFetch(null));

  function capture(payload: V2Page<V2Transaction> | V2TransactionSummary): URL[] {
    const urls: URL[] = [];
    setApiFetch(async (input) => {
      urls.push(new URL(input.toString()));
      return new Response(JSON.stringify(payload), { status: 200 });
    });
    return urls;
  }

  it("sends each filter value as a repeated query parameter with the page cursor", async () => {
    const urls = capture({ items: [], nextCursor: null });
    await ledgerClient.transactions.list(
      { kind: "personal" },
      {
        limit: 50,
        cursor: "2026-09-02:t3",
        accountIds: ["wallet", "bank"],
        categoryIds: ["food"],
        kinds: ["expense", "transfer"],
        from: "2026-09-01",
        to: null,
        search: "  lunch  ",
      },
    );
    const url = urls[0] ?? MISSING;
    const params = url.searchParams;
    expect(url.pathname).toBe("/api/v2/transactions");
    expect(params.getAll("accountId")).toEqual(["wallet", "bank"]);
    expect(params.getAll("categoryId")).toEqual(["food"]);
    expect(params.getAll("kind")).toEqual(["expense", "transfer"]);
    expect(params.get("cursor")).toBe("2026-09-02:t3");
    expect(params.get("from")).toBe("2026-09-01");
    expect(params.has("to")).toBe(false);
    expect(params.get("q")).toBe("lunch");
    expect(params.get("scope")).toBe("personal");
  });

  it("requests and validates the filtered summary", async () => {
    const summary = {
      count: 2,
      totals: [{ currency: "USD", count: 2, incomeMinor: 0, expenseMinor: 200, netMinor: -200 }],
    };
    const urls = capture(summary);
    await expect(
      ledgerClient.transactions.summary({ kind: "personal" }, { categoryIds: ["food"] }),
    ).resolves.toEqual(summary);
    expect(urls[0]?.pathname).toBe("/api/v2/transactions/summary");
    expect(urls[0]?.searchParams.getAll("categoryId")).toEqual(["food"]);
    expect(urls[0]?.searchParams.has("limit")).toBe(false);
  });
});

describe("normalizeTransactionFilters", () => {
  it("gives the same selection one cache key regardless of order or blanks", () => {
    expect(
      normalizeTransactionFilters({
        accountIds: ["b", "a", "b"],
        categoryIds: [],
        kinds: ["transfer", "expense"],
        from: "",
        search: "   ",
      }),
    ).toEqual({
      accountIds: ["a", "b"],
      categoryIds: undefined,
      kinds: ["expense", "transfer"],
      from: undefined,
      to: undefined,
      search: undefined,
    });
  });
});
