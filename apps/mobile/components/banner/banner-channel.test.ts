import { describe, expect, it } from "@jest/globals";

import { SUCCESS_TOAST_MS } from "./banner-channel";

describe("SUCCESS_TOAST_MS", () => {
  it("locks the success toast duration to five seconds", () => {
    expect(SUCCESS_TOAST_MS).toBe(5000);
  });
});
