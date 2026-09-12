import { describe, expect, it } from "vitest";
import { z } from "zod";

import { checkExpectedVersion, issuesFromZod, scopeColumns } from "./shared";

describe("issuesFromZod", () => {
  it("maps nested paths and falls back to (envelope) for root issues", () => {
    const schema = z.object({
      amount: z.number(),
      nested: z.object({ name: z.string().min(1) }),
    });
    const result = schema.safeParse({ amount: "x", nested: { name: "" } });
    expect(result.success).toBe(false);
    if (result.success) return;
    const issues = issuesFromZod(result.error);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "amount" }),
        expect.objectContaining({ field: "nested.name" }),
      ]),
    );

    const refine = z.string().refine(() => false, { message: "nope" });
    const root = refine.safeParse("ok");
    expect(root.success).toBe(false);
    if (root.success) return;
    expect(issuesFromZod(root.error)).toEqual([
      { field: "(envelope)", message: "nope" },
    ]);
  });
});

describe("checkExpectedVersion", () => {
  it("returns null when expectedVersion is absent or matches", () => {
    expect(checkExpectedVersion({ id: "e1", version: 3 }, [])).toBeNull();
    expect(
      checkExpectedVersion({ id: "e1", version: 3 }, [{ expectedVersion: 3 }]),
    ).toBeNull();
  });

  it("returns stale_version when the caller is behind", () => {
    expect(
      checkExpectedVersion({ id: "e1", version: 5 }, [{ expectedVersion: 4 }]),
    ).toEqual({
      kind: "stale_version",
      entityId: "e1",
      expectedVersion: 4,
      actualVersion: 5,
    });
  });
});

describe("scopeColumns", () => {
  it("dual-writes ledgerId and householdId from PlanContext", () => {
    expect(
      scopeColumns({ ledgerId: "personal:u1", householdId: "hh_1" } as never),
    ).toEqual({ ledgerId: "personal:u1", householdId: "hh_1" });
  });
});
