import { describeIntent } from "./intent-summary";

describe("describeIntent", () => {
  it("summarizes amount and description for transactions", () => {
    expect(
      describeIntent("transaction.create", {
        amountMinor: 1250,
        description: "Groceries",
        accountId: "acc-1",
      }),
    ).toBe("Record transaction · Groceries · $12.50");
  });

  it("shows negative amounts with a sign", () => {
    expect(describeIntent("transaction.edit", { amountMinor: -900 })).toBe(
      "Edit transaction · -$9.00",
    );
  });

  it("falls back to the name field for entities like accounts", () => {
    expect(describeIntent("account.create", { name: "Checking", type: "depository" })).toBe(
      "New account · Checking",
    );
  });

  it("truncates long descriptions", () => {
    const summary = describeIntent("transaction.create", { description: "x".repeat(100) });
    expect(summary).toContain("…");
    expect(summary).not.toContain("x".repeat(61));
  });

  it("digests unknown payloads instead of rendering blank", () => {
    expect(describeIntent("assignment.commit", { transactionIds: ["a"] })).toBe(
      "Assign transactions · transactionIds: a",
    );
  });

  it("uses just the label when there is no payload", () => {
    expect(describeIntent("category.archive", null)).toBe("Archive category");
  });
});
