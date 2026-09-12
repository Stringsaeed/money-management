import { describe, expect, it } from "vitest";

import {
  WIDGET_HANDOFF_TTL_MS,
  generateHandoffCode,
  hashHandoffCode,
} from "./widget-handoff";

describe("generateHandoffCode", () => {
  it("returns distinct base64url codes without padding", () => {
    const a = generateHandoffCode();
    const b = generateHandoffCode();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.includes("=")).toBe(false);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });
});

describe("hashHandoffCode", () => {
  it("is deterministic and hides the raw code", async () => {
    const code = "handoff-code-fixture";
    const first = await hashHandoffCode(code);
    const second = await hashHandoffCode(code);
    expect(first).toBe(second);
    expect(first).not.toContain(code);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await hashHandoffCode("other")).not.toBe(first);
  });
});

describe("WIDGET_HANDOFF_TTL_MS", () => {
  it("keeps the exchange window at two minutes", () => {
    expect(WIDGET_HANDOFF_TTL_MS).toBe(120_000);
  });
});
