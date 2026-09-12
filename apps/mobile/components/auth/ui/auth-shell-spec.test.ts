import { describe, expect, it } from "@jest/globals";

import { AUTH_SHELL_SPEC } from "./roles";

describe("AUTH_SHELL_SPEC", () => {
  it("locks auth shell spacing vocabulary", () => {
    expect(AUTH_SHELL_SPEC).toEqual({
      headerSpacing: 8,
      bodySpacing: 12,
      bodyTopPadding: 32,
    });
  });
});
