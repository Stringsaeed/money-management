import { useEffect } from "react";

import { track } from "@/features/analytics";

import type { Attention } from "./attention";
import { useFocusSession } from "./use-focus-session";

/** Budget home viewed, and which reminder-style attention line is showing: once per focus. */
export function useHomeAnalytics(attention: Attention) {
  const session = useFocusSession();
  const kind = attention.top?.kind;
  const type = kind === "payday" ? "payday" : kind === "due_today" ? "due" : null;

  useEffect(() => {
    if (session > 0) track("budget_home_viewed", {});
  }, [session]);

  useEffect(() => {
    if (session > 0 && type) track("reminder_shown", { type });
  }, [session, type]);
}
