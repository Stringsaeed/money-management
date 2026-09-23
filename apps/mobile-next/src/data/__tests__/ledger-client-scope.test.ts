import { withScope } from "@/data/ledger-client";

const household = { kind: "household" as const, householdId: "household-1" };

describe("V2 ledger mutation request scope", () => {
  it.each([
    "/accounts",
    "/accounts/account-1",
    "/categories",
    "/categories/category-1",
    "/transactions",
    "/transactions/transaction-1",
    "/recurring",
    "/recurring/recurring-1",
  ])("adds household scope to %s", (path) => {
    const url = new URL(withScope(path, household), "https://example.test");
    expect(url.searchParams.get("scope")).toBe("household");
    expect(url.searchParams.get("householdId")).toBe("household-1");
  });

  it("does not add a household id to personal scope", () => {
    const url = new URL(withScope("/accounts", { kind: "personal" }), "https://example.test");
    expect(url.searchParams.get("scope")).toBe("personal");
    expect(url.searchParams.has("householdId")).toBe(false);
  });
});
