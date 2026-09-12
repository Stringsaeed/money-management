import { describe, expect, it } from "@jest/globals";

import { AUTH_CONTROL_SPECS } from "./roles";

describe("AUTH_CONTROL_SPECS", () => {
  it("locks primary/secondary/tertiary auth control vocabulary", () => {
    expect(AUTH_CONTROL_SPECS).toEqual({
      primary: {
        height: 40,
        radius: 8,
        fill: {
          kind: "kumo-gradient",
          start: "--color-kumo-brand-emphasis-start",
          end: "--color-kumo-brand-emphasis-end",
        },
        ring: { color: "kumoRing", width: 1 },
        label: { color: "white", weight: "600", size: 13, lineHeight: 21 },
        disabledOpacity: 0.5,
      },
      secondary: {
        height: 40,
        radius: 8,
        fill: { kind: "solid", color: "--color-background" },
        ring: { color: "--color-border", width: 1 },
        label: { color: "--color-foreground", weight: "500", size: 13, lineHeight: 21 },
        disabledOpacity: 0.5,
      },
      tertiary: {
        paddingVertical: 8,
        radius: 0,
        fill: { kind: "none" },
        label: { color: "--color-muted-foreground", weight: "400", size: 13, lineHeight: 21 },
        disabledOpacity: 0.5,
      },
    });
  });
});
