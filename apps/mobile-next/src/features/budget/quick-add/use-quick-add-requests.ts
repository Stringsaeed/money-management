import { useEffect } from "react";

import { listenForQuickAdd } from "./quick-add-requests";

/** Answers the tab bar's Add with `open` while `enabled`. */
export function useQuickAddRequests(enabled: boolean, open: () => void) {
  useEffect(() => {
    if (!enabled) return;
    return listenForQuickAdd(open);
  }, [enabled, open]);
}
