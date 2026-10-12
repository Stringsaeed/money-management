import { differenceInDays, differenceInHours, differenceInMinutes, parseISO } from "date-fns";

/** Compact age of a money move for mono captions: "just now", "5m ago", "2h ago", "3d ago". */
export function activityAgo(createdAt: string, now: Date): string {
  const at = parseISO(createdAt);
  const minutes = differenceInMinutes(now, at);
  if (Number.isNaN(minutes) || minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = differenceInHours(now, at);
  if (hours < 24) return `${hours}h ago`;
  return `${differenceInDays(now, at)}d ago`;
}
