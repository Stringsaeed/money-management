import { describe, expect, it } from "vitest";

import { createAccountPayloadSchema } from "./handlers/account";
import { createTransactionPayloadSchema } from "./handlers/transaction";

describe("createAccountPayloadSchema", () => {
  it("accepts a minimal account and applies defaults", () => {
    const parsed = createAccountPayloadSchema.safeParse({
      name: "Checking",
      type: "bank",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        name: "Checking",
        type: "bank",
        currency: "USD",
        initialBalanceMinor: 0,
        excludeFromTotal: false,
        sortOrder: 0,
      });
    }
  });

  it("rejects blank name, unknown type, and non-3-letter currency", () => {
    expect(createAccountPayloadSchema.safeParse({ name: "", type: "bank" }).success).toBe(false);
    expect(
      createAccountPayloadSchema.safeParse({ name: "Wallet", type: "crypto" }).success,
    ).toBe(false);
    expect(
      createAccountPayloadSchema.safeParse({ name: "Wallet", type: "cash", currency: "US" }).success,
    ).toBe(false);
  });
});

describe("createTransactionPayloadSchema", () => {
  it("accepts an expense and applies nullable defaults", () => {
    const parsed = createTransactionPayloadSchema.safeParse({
      type: "expense",
      amountMinor: 1250,
      date: "2026-09-12",
      accountId: "acc_1",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        type: "expense",
        amountMinor: 1250,
        date: "2026-09-12",
        accountId: "acc_1",
        toAccountId: null,
        categoryId: null,
        description: "",
        isRecurring: false,
      });
    }
  });

  it("rejects non-positive amounts and malformed dates", () => {
    expect(
      createTransactionPayloadSchema.safeParse({
        type: "expense",
        amountMinor: 0,
        date: "2026-09-12",
        accountId: "acc_1",
      }).success,
    ).toBe(false);
    expect(
      createTransactionPayloadSchema.safeParse({
        type: "income",
        amountMinor: 100,
        date: "09/12/2026",
        accountId: "acc_1",
      }).success,
    ).toBe(false);
  });
});
