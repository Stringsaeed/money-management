import type { TabBarKey, TabBarTab } from "@/ui/trove";

/** Tab route names mapped to the Trove tab bar keys; routes not listed here get no tab. */
const TAB_KEYS = {
  "(home)": "home",
  index: "home",
  ledger: "ledger",
  market: "market",
  settings: "settings",
} as const satisfies Record<string, TabBarKey>;

type TabRouteName = keyof typeof TAB_KEYS;

export const isTabRouteName = (name: string): name is TabRouteName => Object.hasOwn(TAB_KEYS, name);

export interface TabRoute {
  readonly key: string;
  readonly name: string;
}

export interface TabEntry {
  readonly route: TabRoute;
  readonly tab: TabBarTab;
}

interface TabEntryInput {
  readonly routes: readonly TabRoute[];
  readonly focusedKey: string | undefined;
  readonly labelFor: (route: TabRoute) => string;
}

/** The visible tabs, in route order, each carrying its route so a press can navigate to it. */
export const buildTabEntries = ({ routes, focusedKey, labelFor }: TabEntryInput): TabEntry[] =>
  routes.flatMap((route) =>
    isTabRouteName(route.name)
      ? [
          {
            route,
            tab: {
              key: TAB_KEYS[route.name],
              label: labelFor(route),
              active: route.key === focusedKey,
            },
          },
        ]
      : [],
  );
