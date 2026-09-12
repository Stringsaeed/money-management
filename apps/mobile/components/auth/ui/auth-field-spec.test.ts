import { describe, expect, it } from "@jest/globals";

import { AUTH_PLACEHOLDER_COLOR } from "./tokens";
import { AUTH_FIELD_SPEC } from "./roles";

describe("AUTH_FIELD_SPEC", () => {
  it("locks auth field chrome vocabulary", () => {
    expect(AUTH_FIELD_SPEC).toEqual({
      height: 56,
      radius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: "--color-input",
      fill: "--color-surface",
      text: { color: "--color-foreground", weight: "500", size: 16, lineHeight: 20 },
      placeholderColor: AUTH_PLACEHOLDER_COLOR,
    });
  });
});
