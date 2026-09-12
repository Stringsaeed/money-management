import { describe, expect, it } from "@jest/globals";

import {
  hrefForInternal,
  parseReturnTo,
  PROFILE_HOUSEHOLD_HREF,
  returnTo,
  serializeReturnTo,
} from "./return-to";

describe("parseReturnTo / serializeReturnTo", () => {
  it("accepts known screen hrefs", () => {
    expect(parseReturnTo("/(tabs)")).toEqual({ kind: "screen", href: "/(tabs)" });
    expect(parseReturnTo("/(tabs)/settings")).toEqual({
      kind: "screen",
      href: "/(tabs)/settings",
    });
  });

  it("defaults unknown or missing targets to profile household", () => {
    expect(parseReturnTo(undefined)).toEqual({ kind: "profile_household" });
    expect(parseReturnTo("/evil")).toEqual({ kind: "profile_household" });
    expect(parseReturnTo("/(tabs)/settings/household")).toEqual({ kind: "profile_household" });
  });

  it("serializes screen targets as href and profile as household path", () => {
    expect(serializeReturnTo({ kind: "screen", href: "/(tabs)" })).toBe("/(tabs)");
    expect(serializeReturnTo({ kind: "profile_household" })).toBe(PROFILE_HOUSEHOLD_HREF);
  });

  it("exposes returnTo helpers for sheet open targets", () => {
    expect(returnTo.profileHousehold()).toEqual({ kind: "profile_household" });
    expect(returnTo.current("/(tabs)/settings")).toEqual({
      kind: "screen",
      href: "/(tabs)/settings",
    });
    expect(returnTo.parse("/(tabs)")).toEqual({ kind: "screen", href: "/(tabs)" });
  });
});

describe("hrefForInternal", () => {
  it("maps known internal hrefs and falls back to root", () => {
    expect(hrefForInternal("/(tabs)/settings/household")).toBe("/(tabs)/settings/household");
    expect(hrefForInternal("/(tabs)/settings")).toBe("/(tabs)/settings");
    expect(hrefForInternal("/(tabs)")).toBe("/");
  });
});
