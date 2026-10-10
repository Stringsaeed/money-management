import type { IconName } from "../icon";

/** System transaction kinds. They get stroke icons so they can't pass for a user's own category. */
export const SYSTEM_KINDS = ["income", "expense", "transfer"] as const;

export type SystemKind = (typeof SYSTEM_KINDS)[number];

export const KIND_ICON = {
  income: "kind-income",
  expense: "kind-expense",
  transfer: "kind-transfer",
} as const satisfies Record<SystemKind, IconName>;
