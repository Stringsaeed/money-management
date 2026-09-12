import { describe, expect, it } from "@jest/globals";

import { normalizeColor } from "./tokens";

describe("normalizeColor", () => {
  it("keeps valid colors and otherwise returns the fallback", () => {
    expect(normalizeColor("#abc", "#000000")).toBe("#abc");
    expect(normalizeColor("#aabbcc", "#000000")).toBe("#aabbcc");
    expect(normalizeColor("rgba(1,2,3,0.5)", "#000000")).toBe("rgba(1,2,3,0.5)");
    expect(normalizeColor("tomato", "#000000")).toBe("tomato");
    expect(normalizeColor(" not-a-color ", "#112233")).toBe("#112233");
  });
});
