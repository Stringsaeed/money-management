import { format, isSameDay, isYesterday, parseISO, subDays } from "date-fns";

/** Emoji shown next to an activity entry — keyed by its lead effect tag. */
export const EFFECT_EMOJIS: Readonly<Record<string, string>> = {
  rules: "🔁",
  upcoming: "📅",
  ledger: "🧾",
  balances: "⚖️",
  summaries: "🏷️",
  envelopes: "✉️",
  assignments: "📌",
  projections: "📈",
  members: "👥",
};

export const effectEmoji = (tag: string): string => EFFECT_EMOJIS[tag] ?? "📝";

/**
 * Human-readable timestamp for a timeline entry:
 * today → "2:05 PM", yesterday → "Yesterday, 2:05 PM", else "Aug 20, 2:05 PM"
 * (year included when the entry is from another year).
 */
export function formatActivityTimestamp(iso: string, now: Date = new Date()): string {
  const date = parseISO(iso);
  const time = format(date, "h:mm a");
  if (isSameDay(date, now)) {
    return time;
  }
  if (isYesterday(date)) {
    return `Yesterday, ${time}`;
  }
  const day = format(date, isSameYear(date, now) ? "MMM d" : "MMM d, yyyy");
  return `${day}, ${time}`;
}

const isSameYear = (date: Date, now: Date) => date.getFullYear() === now.getFullYear();

/** Absolute timestamp for detail views, e.g. "Aug 20, 2026 at 2:05 PM". */
export function formatActivityFullTimestamp(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy 'at' h:mm a");
}

/** Keys of the date-range presets offered on the timeline filter bar. */
export type ActivityRangeKey = "all" | "7d" | "30d" | "90d";

export interface ActivityRangePreset {
  readonly key: ActivityRangeKey;
  /** UI label, emoji included per the design language. */
  readonly label: string;
  readonly days: number | null;
}

export const ACTIVITY_RANGE_PRESETS: readonly ActivityRangePreset[] = [
  { key: "all", label: "All Time", days: null },
  { key: "7d", label: "Last 7 Days", days: 7 },
  { key: "30d", label: "Last 30 Days", days: 30 },
  { key: "90d", label: "Last 90 Days", days: 90 },
];

/**
 * Resolves a range preset into inclusive UTC "YYYY-MM-DD" bounds for the
 * API's `from`/`to` filters; the "all" preset yields no bounds at all.
 */
export function resolveActivityRange(
  key: ActivityRangeKey,
  now: Date = new Date(),
): { fromDate?: string; toDate?: string } {
  const preset = ACTIVITY_RANGE_PRESETS.find((p) => p.key === key);
  if (!preset || preset.days === null) {
    return {};
  }
  return {
    fromDate: format(subDays(now, preset.days), "yyyy-MM-dd"),
    toDate: format(now, "yyyy-MM-dd"),
  };
}

/** Label of a range preset, falling back to "All Time". */
export const activityRangeLabel = (key: string): string =>
  ACTIVITY_RANGE_PRESETS.find((p) => p.key === key)?.label ?? "All Time";
