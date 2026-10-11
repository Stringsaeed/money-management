import { useEffect, useState } from "react";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { scopeKey } from "@/data/ledger-collections";
import { useLedgerData } from "@/data/ledger-queries";
import { formatMoneyMinor } from "@/utils/money";

import { DUE_LOOKAHEAD_DAYS } from "../due/due-model";
import type { UseDue } from "../due/use-due";
import type { ActiveBudgetView } from "../home/home-model";

import {
  getReminderPermission,
  requestReminderPermission,
  syncReminders,
  type ReminderPermission,
} from "./notifications";
import { planBillReminders, planPaydayReminders } from "./reminder-plan";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);
const UPCOMING_PAYDAYS = 2;

export interface ReminderSync {
  /** Explain reminders and offer to turn them on: undecided, wanted, and not dismissed. */
  readonly showPrompt: boolean;
  readonly enable: () => Promise<void>;
  readonly notNow: () => Promise<void>;
}

/**
 * Keeps this ledger's local notifications in step with the Due list and the payday rule once the
 * Budget tab data has loaded. Never asks for permission itself: the prompt does, after explaining.
 */
export function useReminderSync(view: ActiveBudgetView, due: UseDue): ReminderSync {
  const { identityKey, scope } = useLedgerData();
  const scopeId = scopeKey(identityKey, scope);
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const { prefs, dismissPrompt, forgetEndedSnoozes } = due.reminders;

  useEffect(() => {
    getReminderPermission().then(setPermission, () => setPermission("denied"));
  }, []);

  const paydayOn = view.budget.paydayReminder;
  const { paydayRule } = view;
  const periodStart = view.current.period.start;
  const { items, today, loaded } = due;

  useEffect(() => {
    if (permission !== "granted" || !loaded) return;
    const bills = planBillReminders({
      bills: items,
      prefs,
      today,
      horizonDays: DUE_LOOKAHEAD_DAYS,
      money,
    });
    const paydays = paydayOn
      ? planPaydayReminders({
          rule: paydayRule,
          currentPeriodStart: periodStart,
          today,
          count: UPCOMING_PAYDAYS,
        })
      : [];
    syncReminders(scopeId, [...bills, ...paydays], new Date()).catch((cause: unknown) =>
      console.warn("Budget reminders could not be scheduled.", cause),
    );
  }, [permission, loaded, scopeId, items, prefs, today, paydayOn, paydayRule, periodStart]);

  useEffect(() => {
    if (loaded) void forgetEndedSnoozes(today);
  }, [loaded, today, forgetEndedSnoozes]);

  const wanted = paydayOn || items.length > 0;
  return {
    showPrompt: loaded && permission === "undetermined" && wanted && !prefs.promptDismissed,
    enable: async () => {
      setPermission(await requestReminderPermission().catch(() => "denied" as const));
    },
    notNow: dismissPrompt,
  };
}
