import type { Href } from "expo-router";

export interface UpcomingAddAction {
  readonly accessibilityLabel: string;
  readonly buttonLabel: string;
  readonly href: Href | null;
}

export function resolveUpcomingAddAction(
  isAccountsLoading: boolean,
  hasAccounts: boolean,
): UpcomingAddAction {
  if (isAccountsLoading) {
    return { accessibilityLabel: "Loading accounts", buttonLabel: "Loading…", href: null };
  }
  if (!hasAccounts) {
    return {
      accessibilityLabel: "Create account",
      buttonLabel: "Create account →",
      href: "/accounts",
    };
  }
  return {
    accessibilityLabel: "Add a recurring rule",
    buttonLabel: "Add →",
    href: { pathname: "/transaction/[id]", params: { id: "new", recurring: "true" } },
  };
}
