import { describe, expect, it } from "@jest/globals";

import { resolveUpcomingAddAction } from "./upcoming-add-action";

describe("resolveUpcomingAddAction", () => {
  it("returns a loading action while accounts are loading", () => {
    expect(resolveUpcomingAddAction(true, false)).toEqual({
      accessibilityLabel: "Loading accounts",
      buttonLabel: "Loading…",
      href: null,
    });
    expect(resolveUpcomingAddAction(true, true)).toEqual({
      accessibilityLabel: "Loading accounts",
      buttonLabel: "Loading…",
      href: null,
    });
  });

  it("routes to create-account or new recurring rule based on account presence", () => {
    expect(resolveUpcomingAddAction(false, false)).toEqual({
      accessibilityLabel: "Create account",
      buttonLabel: "Create account →",
      href: "/accounts",
    });
    expect(resolveUpcomingAddAction(false, true)).toEqual({
      accessibilityLabel: "Add a recurring rule",
      buttonLabel: "Add →",
      href: { pathname: "/transaction/[id]", params: { id: "new", recurring: "true" } },
    });
  });
});
