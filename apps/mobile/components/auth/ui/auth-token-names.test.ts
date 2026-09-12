import { describe, expect, it } from "@jest/globals";

import { AUTH_TOKEN_NAMES } from "./tokens";

describe("AUTH_TOKEN_NAMES", () => {
  it("locks the auth CSS token name vocabulary", () => {
    expect(AUTH_TOKEN_NAMES).toEqual([
      "--color-ink",
      "--color-foreground",
      "--color-background",
      "--color-surface",
      "--color-input",
      "--color-border",
      "--color-muted-foreground",
      "--color-sage",
      "--color-destructive",
      "--color-kumo-brand-emphasis-start",
      "--color-kumo-brand-emphasis-end",
    ]);
  });
});
