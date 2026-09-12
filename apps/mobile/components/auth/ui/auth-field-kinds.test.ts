import { describe, expect, it } from "@jest/globals";

import { AUTH_FIELD_KINDS } from "./roles";

describe("AUTH_FIELD_KINDS", () => {
  it("locks email/name/password field kind presets", () => {
    expect(AUTH_FIELD_KINDS).toEqual({
      email: {
        secure: false,
        autoCapitalize: "none",
        autoComplete: "email",
        keyboardType: "email-address",
      },
      name: { secure: false, autoCapitalize: "words" },
      password: { secure: true, autoCapitalize: "none" },
    });
  });
});
