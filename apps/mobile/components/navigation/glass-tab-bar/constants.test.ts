import { describe, expect, it } from "@jest/globals";

import { TAB_HEIGHT } from "./constants";

describe("TAB_HEIGHT", () => {
  it("locks glass tab bar height to 44", () => {
    expect(TAB_HEIGHT).toBe(44);
  });
});
