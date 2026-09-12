import { describe, expect, it } from "@jest/globals";

import { SCROLL_FADE_OVERSCAN, TAB_HEIGHT } from "./constants";

describe("TAB_HEIGHT", () => {
  it("locks glass tab bar height to 44", () => {
    expect(TAB_HEIGHT).toBe(44);
  });
});

describe("SCROLL_FADE_OVERSCAN", () => {
  it("locks scroll fade overscan to 48", () => {
    expect(SCROLL_FADE_OVERSCAN).toBe(48);
  });
});
