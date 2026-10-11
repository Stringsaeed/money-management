import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { useDueQuery } from "@/data/ledger-queries";

import type { ActiveBudgetView } from "../home/home-model";
import { snoozedUntil } from "../reminders/reminder-prefs";
import { useReminderPrefs, type UseReminderPrefs } from "../reminders/use-reminder-prefs";

import {
  budgetToday,
  dueGrouping,
  dueNow,
  dueThrough,
  groupDue,
  nextPaydayDate,
  type DueNow,
  type DueSection,
} from "./due-model";

export interface UseDue {
  readonly today: string;
  readonly nextPayday: string;
  /** Pending bills through the lookahead, snoozed ones included (reminders plan from these). */
  readonly items: readonly V2DueOccurrence[];
  readonly sections: readonly DueSection[];
  readonly dueNow: DueNow;
  /** Bills hidden until tomorrow. */
  readonly snoozedCount: number;
  readonly loaded: boolean;
  readonly isError: boolean;
  readonly retry: () => Promise<void>;
  readonly reminders: UseReminderPrefs;
}

/** The Due list for the current Budget Period, with 1-day snoozes applied. */
export function useDue(view: ActiveBudgetView): UseDue {
  const today = budgetToday(view.current);
  const nextPayday = nextPaydayDate(view.current);
  const query = useDueQuery(dueThrough(today, nextPayday));
  const reminders = useReminderPrefs();

  const items = query.data?.items ?? [];
  const visible = items.filter((item) => {
    const until = snoozedUntil(reminders.prefs, item.ruleId, item.scheduledDate);
    return !until || until <= today;
  });

  return {
    today,
    nextPayday,
    items,
    sections: groupDue(visible, dueGrouping(today, nextPayday)),
    dueNow: dueNow(visible, today),
    snoozedCount: items.length - visible.length,
    loaded: query.data !== undefined && reminders.ready,
    isError: query.isError,
    retry: query.retry,
    reminders,
  };
}
