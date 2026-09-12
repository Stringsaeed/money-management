import { describe, expect, it } from "@jest/globals";

import { AUTH_FIELD_KINDS, resolveColor } from "./roles";
import { AUTH_FALLBACK_PALETTE } from "./tokens";

describe("AUTH_FIELD_KINDS", () => {
  it("maps every AuthFieldKind onto its input preset", () => {
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

  it("only exposes email, name, and password field kinds", () => {
    expect(Object.keys(AUTH_FIELD_KINDS).sort()).toEqual(["email", "name", "password"]);
    expect(AUTH_FIELD_KINDS).not.toHaveProperty("phone");
  });
});

describe("resolveColor", () => {
  const palette = AUTH_FALLBACK_PALETTE.light;

  it("resolves token, ring, and white refs", () => {
    expect(resolveColor("--color-ink", palette)).toBe(palette["--color-ink"]);
    expect(resolveColor("kumoRing", palette)).toBe(palette.kumoRing);
    expect(resolveColor("white", palette)).toBe("#ffffff");
  });
});
