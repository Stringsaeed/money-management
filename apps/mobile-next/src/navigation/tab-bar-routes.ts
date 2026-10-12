import type { TabBarKey, TabBarTab } from "@/ui/trove";

/** Tab route names mapped to the Trove tab bar keys; routes not listed here get no tab. */
const TAB_KEYS = {
  "(home)": "home",
  index: "home",
  envelopes: "budget",
  ledger: "ledger",
  market: "market",
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
  /** Route names kept out of the bar, such as a feature that is switched off. */
  readonly hiddenRoutes?: readonly string[];
}

/** The visible tabs, in route order, each carrying its route so a press can navigate to it. */
export const buildTabEntries = ({
  routes,
  focusedKey,
  labelFor,
  hiddenRoutes = [],
}: TabEntryInput): TabEntry[] =>
  routes.flatMap((route) =>
    isTabRouteName(route.name) && !hiddenRoutes.includes(route.name)
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
