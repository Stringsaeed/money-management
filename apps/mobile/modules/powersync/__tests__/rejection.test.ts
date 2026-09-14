import { describeRejection, isRejectionKind, parseRejection } from "../rejection";

describe("isRejectionKind", () => {
  it("accepts every kind of the typed rejection union", () => {
    expect(isRejectionKind("stale_version")).toBe(true);
    expect(isRejectionKind("invalid_intent")).toBe(true);
    expect(isRejectionKind("preview_required")).toBe(true);
    expect(isRejectionKind("missing_entity")).toBe(true);
    expect(isRejectionKind("forbidden")).toBe(true);
    expect(isRejectionKind("conflict")).toBe(true);
  });

  it("rejects applied results and non-strings", () => {
    expect(isRejectionKind("applied")).toBe(false);
    expect(isRejectionKind(42)).toBe(false);
    expect(isRejectionKind(undefined)).toBe(false);
  });
});

describe("parseRejection", () => {
  it("round-trips every server rejection variant", () => {
    const stale = parseRejection({
      kind: "stale_version",
      entityId: "tx-1",
      expectedVersion: 2,
      actualVersion: 5,
    });
    expect(stale).toEqual({
      kind: "stale_version",
      entityId: "tx-1",
      expectedVersion: 2,
      actualVersion: 5,
    });

    const invalid = parseRejection({
      kind: "invalid_intent",
      issues: [{ field: "amountMinor", message: "must be positive" }],
    });
    expect(invalid).toEqual({
      kind: "invalid_intent",
      issues: [{ field: "amountMinor", message: "must be positive" }],
    });

    const preview = parseRejection({ kind: "preview_required", issues: [] });
    expect(preview).toEqual({ kind: "preview_required", issues: [] });

    const missing = parseRejection({
      kind: "missing_entity",
      entityType: "account",
      entityId: "acc-9",
    });
    expect(missing).toEqual({ kind: "missing_entity", entityType: "account", entityId: "acc-9" });

    const forbidden = parseRejection({
      kind: "forbidden",
      role: "viewer",
      requiredCapability: "commands:transaction.remove",
    });
    expect(forbidden).toEqual({
      kind: "forbidden",
      role: "viewer",
      requiredCapability: "commands:transaction.remove",
    });

    const conflict = parseRejection({
      kind: "conflict",
      reason: "unassigned_money_changed",
      current: { unassignedMinor: 1200 },
    });
    expect(conflict).toEqual({
      kind: "conflict",
      reason: "unassigned_money_changed",
      current: { unassignedMinor: 1200 },
    });
  });

  it("fills safe defaults for malformed payloads instead of throwing", () => {
    expect(parseRejection(null)).toEqual({ kind: "conflict", reason: "unknown_rejection_shape" });
    expect(parseRejection("nope")).toEqual({ kind: "conflict", reason: "unknown_rejection_shape" });
    expect(parseRejection({ kind: "from_the_future" })).toEqual({
      kind: "conflict",
      reason: "unknown_rejection_shape",
    });
    expect(parseRejection({ kind: "stale_version" })).toEqual({
      kind: "stale_version",
      entityId: "unknown",
      expectedVersion: 0,
      actualVersion: 0,
    });
    expect(parseRejection({ kind: "invalid_intent" })).toEqual({
      kind: "invalid_intent",
      issues: [],
    });
    expect(parseRejection({ kind: "invalid_intent", issues: [null, { message: "x" }] })).toEqual({
      kind: "invalid_intent",
      issues: [
        { field: "unknown", message: "This value was rejected." },
        { field: "unknown", message: "x" },
      ],
    });
    expect(parseRejection({ kind: "forbidden", role: "emperor" })).toEqual({
      kind: "forbidden",
      role: null,
      requiredCapability: "unknown capability",
    });
  });
});

describe("describeRejection", () => {
  it("renders a precise sentence per rejection type", () => {
    expect(describeRejection(parseRejection(null))).toContain("Conflicts with a recent change");
    expect(
      describeRejection({
        kind: "stale_version",
        entityId: "tx-1",
        expectedVersion: 2,
        actualVersion: 5,
      }),
    ).toBe("Changed elsewhere since you drafted this (version 2 → 5). Review and resubmit.");
    expect(
      describeRejection({
        kind: "invalid_intent",
        issues: [
          { field: "amountMinor", message: "must be positive" },
          { field: "date", message: "cannot be in the future" },
        ],
      }),
    ).toBe("amountMinor: must be positive · date: cannot be in the future");
    expect(describeRejection({ kind: "invalid_intent", issues: [] })).toBe(
      "Some values in this change were not valid.",
    );
    expect(
      describeRejection({ kind: "missing_entity", entityType: "account", entityId: "acc-9" }),
    ).toBe("This account no longer exists.");
    expect(
      describeRejection({
        kind: "forbidden",
        role: "viewer",
        requiredCapability: "commands:transaction.remove",
      }),
    ).toBe("Your role (viewer) cannot do this — requires commands:transaction.remove.");
    expect(describeRejection({ kind: "forbidden", role: null, requiredCapability: "x" })).toBe(
      "You no longer have access — requires x.",
    );
    expect(describeRejection({ kind: "conflict", reason: "unassigned_money_changed" })).toBe(
      "Conflicts with a recent change (unassigned_money_changed).",
    );
  });
});
