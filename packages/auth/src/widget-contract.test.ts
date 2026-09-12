import { describe, expect, it } from "vitest";

import { WIDGET_SAFEGUARD_FINDINGS } from "./widget-contract";

describe("WIDGET_SAFEGUARD_FINDINGS", () => {
  it("lists every documented widget safeguard finding", () => {
    expect([...WIDGET_SAFEGUARD_FINDINGS]).toEqual([
      "WorkOS User Management widget does not document prevention of sole-admin self-removal or self-demotion for customer organizations.",
      "Trove must keep an app-owned User-deletion guard for sole-admin Households.",
      "Post-event repair via webhooks is not prevention; do not treat webhook reconciliation as a last-admin invariant.",
      "Widget tokens are admin-only; members and viewers are denied at the Trove boundary.",
    ]);
  });

  it("contains exactly four safeguard findings", () => {
    expect(WIDGET_SAFEGUARD_FINDINGS).toHaveLength(4);
    expect(new Set(WIDGET_SAFEGUARD_FINDINGS).size).toBe(4);
  });
});
