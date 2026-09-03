import type { InternalHref, ReturnTo } from "./types";

export const PROFILE_HOUSEHOLD_HREF: InternalHref = "/(tabs)/settings/household";

export function parseReturnTo(raw: string | undefined): ReturnTo {
  if (raw === "/(tabs)" || raw === "/(tabs)/settings") {
    return { kind: "screen", href: raw };
  }
  return { kind: "profile_household" };
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
