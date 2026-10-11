import { useState } from "react";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

export interface MarkPaidTarget {
  readonly open: boolean;
  /** Kept after closing so the sheet can animate out with its content. */
  readonly item: V2DueOccurrence | null;
  /** Changes on every open so the form starts from the bill's values each time. */
  readonly session: number;
}

/** Which bill the Mark paid sheet is open for. */
export function useMarkPaidTarget() {
  const [target, setTarget] = useState<MarkPaidTarget>({ open: false, item: null, session: 0 });
  return {
    target,
    openFor: (item: V2DueOccurrence) =>
      setTarget((current) => ({ open: true, item, session: current.session + 1 })),
    close: () => setTarget((current) => ({ ...current, open: false })),
  };
}
