import { format, parseISO } from "date-fns";

export interface DateChipParts {
  /** Three-letter month, e.g. `Oct` (the chip prints it in capitals). */
  readonly month: string;
  /** Day of month without a leading zero. */
  readonly day: string;
  /** One spoken date, e.g. `12 October`. */
  readonly spoken: string;
}

/** Splits an ISO date (`yyyy-MM-dd`) into what the chip prints and what it speaks. */
export function dateChipParts(isoDate: string): DateChipParts {
  const date = parseISO(isoDate);
  return {
    month: format(date, "MMM"),
    day: format(date, "d"),
    spoken: format(date, "d MMMM"),
  };
}
