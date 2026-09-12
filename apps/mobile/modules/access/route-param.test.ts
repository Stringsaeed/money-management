import { describe, expect, it } from "@jest/globals";

import { firstRouteParam } from "./route-param";

describe("firstRouteParam", () => {
  it("returns a plain string param unchanged", () => {
    expect(firstRouteParam("hh_1")).toBe("hh_1");
  });

  it("takes the first entry from Expo Router string[] params", () => {
    expect(firstRouteParam(["hh_1", "hh_2"])).toBe("hh_1");
  });

  it("preserves undefined and empty-array first slot", () => {
    expect(firstRouteParam(undefined)).toBeUndefined();
    expect(firstRouteParam([])).toBeUndefined();
  });
});
