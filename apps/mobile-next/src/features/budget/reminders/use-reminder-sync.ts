import { useEffect, useState } from "react";

import { useLedgerData } from "@/data/ledger-queries";
import { useBudgetingEnabled } from "@/features/feature-flags";
import { formatMoneyMinor } from "@/utils/money";

import { DUE_LOOKAHEAD_DAYS } from "../due/due-model";

import {
  getReminderPermission,
  requestReminderPermission,
  syncReminders,
  type ReminderPermission,
} from "./notifications";
import { planLedgerReminders, type PlannedReminder } from "./reminder-plan";
import { useReminderPrefs } from "./use-reminder-prefs";
import { useReminderSources } from "./use-reminder-sources";

export interface ReminderSync {
  /** Explain reminders and offer to turn them on: undecided, wanted, and not dismissed. */
  readonly showPrompt: boolean;
  readonly enable: () => Promise<void>;
  readonly notNow: () => Promise<void>;
}

/**
 * Keeps this ledger's local notifications in step with every budget's Due list and payday rule
 * once their data has loaded. Never asks for permission itself: the prompt does, after explaining.
 */
export function useReminderSync(): ReminderSync {
  const { identityKey, scope } = useLedgerData();
  const budgeting = useBudgetingEnabled();
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const { prefs, ready, dismissPrompt, forgetEndedSnoozes } = useReminderPrefs();
  const { loaded, today, sources, wanted } = useReminderSources(prefs, ready);

  useEffect(() => {
    getReminderPermission().then(setPermission, () => setPermission("denied"));
  }, []);

  const planned = loaded
    ? planLedgerReminders({
        sources,
        prefs,
        today,
        horizonDays: DUE_LOOKAHEAD_DAYS,
        money: formatMoneyMinor,
      })
    : null;
  // The plan as text, so an unchanged plan does not re-run the effect on every render.
  const planKey = planned ? JSON.stringify(planned) : null;

  useEffect(() => {
    if (!budgeting || permission !== "granted" || planKey === null) return;
    // SAFETY: `planKey` is the JSON of the `PlannedReminder[]` built above, and nothing else.
    const reminders = JSON.parse(planKey) as PlannedReminder[];
    syncReminders({ identityKey, scope }, reminders, new Date()).catch((cause: unknown) =>
      console.warn("Budget reminders could not be scheduled.", cause),
    );
  }, [budgeting, permission, planKey, identityKey, scope]);

  useEffect(() => {
    if (loaded) void forgetEndedSnoozes(today);
  }, [loaded, today, forgetEndedSnoozes]);

  return {
    showPrompt:
      budgeting && loaded && permission === "undetermined" && wanted && !prefs.promptDismissed,
    enable: async () => {
      setPermission(await requestReminderPermission().catch(() => "denied" as const));
    },
    notNow: dismissPrompt,
  };
}
