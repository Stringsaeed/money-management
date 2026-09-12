import { describe, expect, it } from "vitest";

import { commandLedgerId, personalLedgerId, resolveCommandScope } from "@trove/protocol";

import { commandEnvelopeSchema, commandScopeSchema, preconditionSchema } from "./schema";

const base = {
  commandId: "33333333-3333-4333-8333-333333333333",
  householdId: "household-1",
  payload: {},
} as const;

describe("commandEnvelopeSchema", () => {
  it("accepts removed command kinds so the pipeline can return invalid_intent", () => {
    const parsed = commandEnvelopeSchema.safeParse({
      ...base,
      kind: "card_payment.record",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kind).toBe("card_payment.record");
    }
  });

  it("still rejects an empty kind", () => {
    const parsed = commandEnvelopeSchema.safeParse({ ...base, kind: "" });
    expect(parsed.success).toBe(false);
  });

  it("accepts a personal scope with no householdId", () => {
    const parsed = commandEnvelopeSchema.safeParse({
      commandId: base.commandId,
      payload: {},
      scope: { type: "personal" },
      kind: "account.create",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an envelope that names neither a scope nor a household", () => {
    const parsed = commandEnvelopeSchema.safeParse({
      commandId: base.commandId,
      payload: {},
      kind: "account.create",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["scope"]);
    }
  });

  it("rejects an organization scope with a blank organizationId", () => {
    const parsed = commandEnvelopeSchema.safeParse({
      commandId: base.commandId,
      payload: {},
      scope: { type: "organization", organizationId: "" },
      kind: "account.create",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("resolveCommandScope", () => {
  it("binds a personal scope to the authenticated user, never the payload", () => {
    const envelope = { scope: { type: "personal" } } as const;
    expect(resolveCommandScope(envelope, "user-alice")).toEqual({
      type: "personal",
      userId: "user-alice",
    });
    expect(commandLedgerId(envelope, "user-alice")).toBe(personalLedgerId("user-alice"));
  });

  it("reads a bare householdId as an organization scope", () => {
    expect(resolveCommandScope({ householdId: "household-1" }, "user-alice")).toEqual({
      type: "organization",
      organizationId: "household-1",
    });
  });

  it("lets an explicit scope win over a legacy householdId", () => {
    const scope = resolveCommandScope(
      { householdId: "household-1", scope: { type: "personal" } },
      "user-alice",
    );
    expect(scope).toEqual({ type: "personal", userId: "user-alice" });
  });

  it("returns null when the envelope names no ledger", () => {
    expect(resolveCommandScope({}, "user-alice")).toBeNull();
    expect(commandLedgerId({}, "user-alice")).toBeNull();
  });
});

describe("preconditionSchema", () => {
  it("accepts empty and partially populated preconditions", () => {
    expect(preconditionSchema.safeParse({}).success).toBe(true);
    expect(
      preconditionSchema.safeParse({
        entityId: "acc_1",
        expectedVersion: 3,
        predicate: "account_exists",
        args: { currency: "USD" },
      }).success,
    ).toBe(true);
  });

  it("rejects blank entityId/predicate and negative expectedVersion", () => {
    expect(preconditionSchema.safeParse({ entityId: "" }).success).toBe(false);
    expect(preconditionSchema.safeParse({ predicate: "" }).success).toBe(false);
    expect(preconditionSchema.safeParse({ expectedVersion: -1 }).success).toBe(false);
  });
});

describe("commandScopeSchema", () => {
  it("accepts personal and organization scopes", () => {
    expect(commandScopeSchema.safeParse({ type: "personal" }).success).toBe(true);
    expect(
      commandScopeSchema.safeParse({ type: "organization", organizationId: "org_1" }).success,
    ).toBe(true);
  });

  it("rejects unknown types and blank organizationId", () => {
    expect(commandScopeSchema.safeParse({ type: "shared" }).success).toBe(false);
    expect(
      commandScopeSchema.safeParse({ type: "organization", organizationId: "" }).success,
    ).toBe(false);
  });
});
