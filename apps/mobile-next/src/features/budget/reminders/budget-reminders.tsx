import { useEffect } from "react";

import { track } from "@/features/analytics";

import type { UseDue } from "../due/use-due";
import type { ActiveBudgetView } from "../home/home-model";
import { useFocusSession } from "../home/use-focus-session";

import { ReminderPrompt } from "./reminder-prompt";
import { useReminderSync } from "./use-reminder-sync";

interface BudgetRemindersProps {
  readonly view: ActiveBudgetView;
  readonly due: UseDue;
}

/** Schedules the local reminders for the loaded Budget, and asks to turn them on when undecided. */
export function BudgetReminders({ view, due }: BudgetRemindersProps) {
  const sync = useReminderSync(view, due);
  const session = useFocusSession();
  useEffect(() => {
    if (session > 0 && sync.showPrompt) track("reminder_shown", { type: "due" });
  }, [session, sync.showPrompt]);
  if (!sync.showPrompt) return null;
  return <ReminderPrompt onEnable={() => void sync.enable()} onNotNow={() => void sync.notNow()} />;
}
