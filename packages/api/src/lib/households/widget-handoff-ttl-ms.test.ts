import { describe, expect, it } from "vitest";

import { WIDGET_HANDOFF_TTL_MS } from "./widget-handoff";

describe("WIDGET_HANDOFF_TTL_MS", () => {
  it("locks widget handoff TTL at two minutes", () => {
    expect(WIDGET_HANDOFF_TTL_MS).toBe(120_000);
  });
});
