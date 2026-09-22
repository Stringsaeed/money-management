import type { IconName } from "../icon";

const TAB_ICONS = {
  "(home)": "house",
  index: "house",
  ledger: "book-open",
  market: "chart-line-up",
  envelopes: "envelope",
  settings: "gear",
} satisfies Record<string, IconName>;

export const getTabIcon = (routeName: string) =>
  hasTabIcon(routeName) ? TAB_ICONS[routeName] : undefined;

export const hasTabIcon = (routeName: string): routeName is keyof typeof TAB_ICONS =>
  Object.hasOwn(TAB_ICONS, routeName);
