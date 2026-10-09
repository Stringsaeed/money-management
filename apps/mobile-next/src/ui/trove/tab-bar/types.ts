import type { NavIconName } from "../icon";

/** Destinations in the pill; each key picks its outline/filled icon pair. */
export type TabBarKey = Extract<NavIconName, "home" | "ledger" | "insights" | "settings">;

export interface TabBarTab {
  key: TabBarKey;
  /** Spoken name; tabs are icon-only. */
  label: string;
  active: boolean;
  /** Eight-point attention dot, e.g. an action is waiting in Settings. */
  badge?: boolean;
}
