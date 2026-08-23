/**
 * Local-date resolution for a Rule's time zone (#88). Pure `Intl` port of the
 * client clock (`apps/mobile/modules/recurring-rules/clock.ts`) so the server
 * evaluates cadence on exactly the same calendar the user sees.
 */
export function localDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) {
    throw new Error(`Cannot resolve a local date for time zone ${timeZone}.`);
  }
  return `${year}-${month}-${day}`;
}
