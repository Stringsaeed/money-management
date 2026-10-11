import { useEffect } from "react";

import { track } from "@/features/analytics";

import { useFocusSession } from "../home/use-focus-session";

import { ReminderPrompt } from "./reminder-prompt";
import { useReminderSync } from "./use-reminder-sync";

/** Schedules the local reminders for every budget of the ledger, and asks to turn them on when undecided. */
export function BudgetReminders() {
  const sync = useReminderSync();
  const session = useFocusSession();
  useEffect(() => {
    if (session > 0 && sync.showPrompt) track("reminder_shown", { type: "due" });
  }, [session, sync.showPrompt]);
  if (!sync.showPrompt) return null;
  return <ReminderPrompt onEnable={() => void sync.enable()} onNotNow={() => void sync.notNow()} />;
}
