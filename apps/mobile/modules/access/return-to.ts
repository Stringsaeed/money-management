import type { Href } from "expo-router";

import type { InternalHref, ReturnTo } from "./types";

export const PROFILE_HOUSEHOLD_HREF: InternalHref = "/(tabs)/settings/household";

export function parseReturnTo(raw: string | undefined): ReturnTo {
  if (raw === "/(tabs)" || raw === "/(tabs)/settings") {
    return { kind: "screen", href: raw };
  }
  return { kind: "profile_household" };
}

export function serializeReturnTo(target: ReturnTo): string {
  return target.kind === "screen" ? target.href : PROFILE_HOUSEHOLD_HREF;
}

export function hrefForInternal(target: InternalHref): Href {
  if (target === "/(tabs)/settings/household") return "/(tabs)/settings/household";
  if (target === "/(tabs)/settings") return "/(tabs)/settings";
  return "/";
}

export const returnTo = {
  profileHousehold(): ReturnTo {
    return { kind: "profile_household" };
  },
  current(href?: string): ReturnTo {
    return parseReturnTo(href);
  },
  parse(raw: string | undefined): ReturnTo {
    return parseReturnTo(raw);
  },
};
