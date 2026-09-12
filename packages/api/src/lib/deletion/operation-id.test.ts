import { describe, expect, it } from "vitest";

import { newDeletionOperationId } from "./service";

describe("newDeletionOperationId", () => {
  it("prefixes user and household kinds with the target id and a UUID suffix", () => {
    const userOp = newDeletionOperationId("user", "user_01");
    const householdOp = newDeletionOperationId("household", "org_01");

    expect(userOp).toMatch(
      /^user:user_01:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(householdOp).toMatch(
      /^household:org_01:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("mints a distinct id on each call", () => {
    const first = newDeletionOperationId("user", "user_01");
    const second = newDeletionOperationId("user", "user_01");
    expect(first).not.toBe(second);
  });
});
