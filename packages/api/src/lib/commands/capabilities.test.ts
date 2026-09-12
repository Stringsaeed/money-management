import type { CommandKind } from "@trove/protocol";
import { describe, expect, it } from "vitest";

import { can, requiredCapability } from "./capabilities";

const ADMIN_ONLY: readonly CommandKind[] = [
  "account.create",
  "account.update",
  "account.archive",
  "category.create",
  "category.update",
  "category.archive",
  "recurring.change",
  "budget.configure",
  "import_bundle",
];

const ADMIN_OR_MEMBER: readonly CommandKind[] = [
  "transaction.create",
  "transaction.edit",
  "transaction.remove",
  "assignment.commit",
  "assignment.correct",
  "refund.link",
];

describe("can", () => {
  it("lets admin issue every command kind", () => {
    for (const kind of [...ADMIN_ONLY, ...ADMIN_OR_MEMBER]) {
      expect(can("admin", kind)).toBe(true);
    }
  });

  it("lets member issue write kinds but not admin-only or import_bundle", () => {
    for (const kind of ADMIN_OR_MEMBER) {
      expect(can("member", kind)).toBe(true);
    }
    for (const kind of ADMIN_ONLY) {
      expect(can("member", kind)).toBe(false);
    }
  });

  it("lets viewer and unknown role slugs issue nothing", () => {
    for (const kind of [...ADMIN_ONLY, ...ADMIN_OR_MEMBER]) {
      expect(can("viewer", kind)).toBe(false);
      expect(can("billing", kind)).toBe(false);
      expect(can("", kind)).toBe(false);
    }
  });
});

describe("requiredCapability", () => {
  it("labels forbidden results with the command kind", () => {
    expect(requiredCapability("import_bundle")).toBe("commands:import_bundle");
    expect(requiredCapability("transaction.create")).toBe("commands:transaction.create");
  });
});
