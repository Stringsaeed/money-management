import { describe, expect, it } from "@jest/globals";

import { AUTH_PLACEHOLDER_COLOR } from "./tokens";

describe("AUTH_PLACEHOLDER_COLOR", () => {
  it("locks the auth placeholder ink", () => {
    expect(AUTH_PLACEHOLDER_COLOR).toBe("#9a9896");
  });
});
