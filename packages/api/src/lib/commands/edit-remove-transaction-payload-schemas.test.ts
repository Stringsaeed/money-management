import { describe, expect, it } from "vitest";

import {
  editTransactionPayloadSchema,
  removeTransactionPayloadSchema,
} from "./handlers/transaction";

describe("editTransactionPayloadSchema", () => {
  it("accepts transactionId with optional patch fields", () => {
    const parsed = editTransactionPayloadSchema.safeParse({
      transactionId: "txn_1",
      type: "expense",
      amountMinor: 2500,
      date: "2026-09-12",
      accountId: "acc_1",
      toAccountId: null,
      categoryId: "cat_1",
      description: "Groceries",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        transactionId: "txn_1",
        type: "expense",
        amountMinor: 2500,
        date: "2026-09-12",
        accountId: "acc_1",
        toAccountId: null,
        categoryId: "cat_1",
        description: "Groceries",
      });
    }
  });

  it("rejects blank transactionId, non-positive amount, and malformed date", () => {
    expect(editTransactionPayloadSchema.safeParse({ transactionId: "" }).success).toBe(false);
    expect(
      editTransactionPayloadSchema.safeParse({
        transactionId: "txn_1",
        amountMinor: 0,
      }).success,
    ).toBe(false);
    expect(
      editTransactionPayloadSchema.safeParse({
        transactionId: "txn_1",
        date: "09/12/2026",
      }).success,
    ).toBe(false);
  });
});

describe("removeTransactionPayloadSchema", () => {
  it("accepts a non-empty transactionId", () => {
    expect(removeTransactionPayloadSchema.safeParse({ transactionId: "txn_1" })).toEqual({
      success: true,
      data: { transactionId: "txn_1" },
    });
  });

  it("rejects a blank transactionId", () => {
    expect(removeTransactionPayloadSchema.safeParse({ transactionId: "" }).success).toBe(false);
  });
});
