import { describe, expect, it } from "vitest";

import {
  archiveAccountPayloadSchema,
  updateAccountPayloadSchema,
} from "./handlers/account";

describe("updateAccountPayloadSchema", () => {
  it("accepts accountId with optional patch fields", () => {
    const parsed = updateAccountPayloadSchema.safeParse({
      accountId: "acc_1",
      name: "Savings",
      color: "#112233",
      icon: "building.columns.fill",
      excludeFromTotal: true,
      sortOrder: 2,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        accountId: "acc_1",
        name: "Savings",
        color: "#112233",
        icon: "building.columns.fill",
        excludeFromTotal: true,
        sortOrder: 2,
      });
    }
  });

  it("rejects blank accountId and blank optional name", () => {
    expect(updateAccountPayloadSchema.safeParse({ accountId: "" }).success).toBe(false);
    expect(
      updateAccountPayloadSchema.safeParse({ accountId: "acc_1", name: "" }).success,
    ).toBe(false);
  });
});

describe("archiveAccountPayloadSchema", () => {
  it("accepts a non-empty accountId", () => {
    expect(archiveAccountPayloadSchema.safeParse({ accountId: "acc_1" })).toEqual({
      success: true,
      data: { accountId: "acc_1" },
    });
  });

  it("rejects a blank accountId", () => {
    expect(archiveAccountPayloadSchema.safeParse({ accountId: "" }).success).toBe(false);
  });
});
