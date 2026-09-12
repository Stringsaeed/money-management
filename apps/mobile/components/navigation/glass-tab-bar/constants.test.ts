import { describe, expect, it } from "@jest/globals";

import {
  BACKGROUND_COLORS,
  CREATE_SIZE,
  PILL_PADDING,
  SCROLL_FADE_OVERSCAN,
  TAB_HEIGHT,
  TAB_WIDTH,
} from "./constants";

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

describe("CREATE_SIZE", () => {
  it("locks create tab button size to 58", () => {
    expect(CREATE_SIZE).toBe(58);
  });
});

describe("PILL_PADDING", () => {
  it("locks glass tab bar pill padding to 6", () => {
    expect(PILL_PADDING).toBe(6);
  });
});

describe("TAB_WIDTH", () => {
  it("locks glass tab bar width to 50", () => {
    expect(TAB_WIDTH).toBe(50);
  });
});

describe("BACKGROUND_COLORS", () => {
  it("locks scroll-fade theme backgrounds", () => {
    expect(BACKGROUND_COLORS).toEqual({
      light: "#f5f5f0",
      dark: "#0f1a14",
    });
  });
});
