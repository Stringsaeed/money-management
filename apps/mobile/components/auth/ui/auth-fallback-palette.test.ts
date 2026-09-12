import { describe, expect, it } from "@jest/globals";

import { AUTH_FALLBACK_PALETTE } from "./tokens";

describe("AUTH_FALLBACK_PALETTE", () => {
  it("locks light and dark auth fallback palettes", () => {
    expect(AUTH_FALLBACK_PALETTE).toEqual({
      light: {
        "--color-ink": "#2c5f47",
        "--color-foreground": "#2c5f47",
        "--color-background": "#f5f5f0",
        "--color-surface": "#f5f5f0",
        "--color-input": "#cfddd2",
        "--color-border": "#cfddd2",
        "--color-muted-foreground": "#6e8a7c",
        "--color-sage": "#4a8f69",
        "--color-destructive": "#c4452f",
        "--color-kumo-brand-emphasis-start": "#619eff",
        "--color-kumo-brand-emphasis-end": "#2f6cf6",
        kumoRing: "#045ede",
        scheme: "light",
      },
      dark: {
        "--color-ink": "#d6e8dc",
        "--color-foreground": "#d6e8dc",
        "--color-background": "#0f1a14",
        "--color-surface": "#0f1a14",
        "--color-input": "#2a3a31",
        "--color-border": "#2a3a31",
        "--color-muted-foreground": "#8fae9d",
        "--color-sage": "#6fb58a",
        "--color-destructive": "#e0644e",
        "--color-kumo-brand-emphasis-start": "#5491f6",
        "--color-kumo-brand-emphasis-end": "#2a61dd",
        kumoRing: "#004dcc",
        scheme: "dark",
      },
    });
  });
});
