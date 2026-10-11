import type { UseDue } from "../due/use-due";
import type { ActiveBudgetView } from "../home/home-model";

import { ReminderPrompt } from "./reminder-prompt";
import { useReminderSync } from "./use-reminder-sync";

interface BudgetRemindersProps {
  readonly view: ActiveBudgetView;
  readonly due: UseDue;
}

/** Schedules the local reminders for the loaded Budget, and asks to turn them on when undecided. */
export function BudgetReminders({ view, due }: BudgetRemindersProps) {
  const sync = useReminderSync(view, due);
  if (!sync.showPrompt) return null;
  return <ReminderPrompt onEnable={() => void sync.enable()} onNotNow={() => void sync.notNow()} />;
}
