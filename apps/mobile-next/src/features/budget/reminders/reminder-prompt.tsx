import { HomePromptCard } from "../home/home-prompt-card";

interface ReminderPromptProps {
  readonly onEnable: () => void;
  readonly onNotNow: () => void;
}

/** Explains reminders before the system permission dialog, which only appears after "Turn on". */
export function ReminderPrompt({ onEnable, onNotNow }: ReminderPromptProps) {
  return (
    <HomePromptCard
      link={{ label: "Not now", onPress: onNotNow }}
      message="Trove can remind you on this phone: at most one reminder a day, plus one on payday. Nothing is paid or recorded until you tap Mark paid."
      primary={{ label: "Turn on reminders", onPress: onEnable }}
      title="Get a nudge when a bill is due"
    />
  );
}
