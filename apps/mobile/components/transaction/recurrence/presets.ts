import type { RecurrenceFrequency } from "@/types";

export type RepeatPresetKey =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "yearly"
  | "custom";

export interface RepeatPreset {
  key: Exclude<RepeatPresetKey, "custom">;
  label: string;
  frequency: RecurrenceFrequency;
  intervalCount: number;
}

/** Quick presets shown in the Repeats menu (all map onto {frequency, intervalCount}). */
export const REPEAT_PRESETS: RepeatPreset[] = [
  { key: "daily", label: "Daily", frequency: "day", intervalCount: 1 },
  { key: "weekly", label: "Weekly", frequency: "week", intervalCount: 1 },
  { key: "biweekly", label: "Every 2 weeks", frequency: "week", intervalCount: 2 },
  { key: "monthly", label: "Monthly", frequency: "month", intervalCount: 1 },
  { key: "bimonthly", label: "Every 2 months", frequency: "month", intervalCount: 2 },
  { key: "yearly", label: "Yearly", frequency: "year", intervalCount: 1 },
];

/** Maps a {frequency, intervalCount} pair back to a preset key, or "custom". */
export function presetKeyFor(
  frequency: RecurrenceFrequency,
  intervalCount: number,
): RepeatPresetKey {
  const match = REPEAT_PRESETS.find(
    (preset) => preset.frequency === frequency && preset.intervalCount === intervalCount,
  );
  return match?.key ?? "custom";
}

export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  day: "days",
  week: "weeks",
  month: "months",
  year: "years",
};
