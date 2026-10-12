import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

/** Design emoji for a group, for Trove `emoji` props when an envelope has none of its own. */
export const GROUP_EMOJI = {
  bills: "🧾",
  everyday: "🛒",
  saving: "🏠",
} as const satisfies Record<V2EnvelopeGroup, string>;

export const GROUP_LABEL = {
  bills: "Bills",
  everyday: "Everyday",
  saving: "Saving for",
} as const satisfies Record<V2EnvelopeGroup, string>;

export const GROUP_ORDER: readonly V2EnvelopeGroup[] = ["bills", "everyday", "saving"];
