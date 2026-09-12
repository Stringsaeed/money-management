import { describe, expect, it } from "@jest/globals";

import { BANNER_TOAST_IDS } from "./banner-channel";

describe("BANNER_TOAST_IDS", () => {
  it("locks banner toast id vocabulary", () => {
    expect(BANNER_TOAST_IDS).toEqual({
      access: "banner:access",
      sync: "banner:sync",
      settlement: "banner:settlement",
    });
  });
});
