import { format, parseISO } from "date-fns";

import type { V2Envelope } from "@trove/api/v2/contracts";

import { nextDueDate } from "./big-payment-model";

/** "AED 3,000 set aside · AED 500 left after", or how far over it ends up. */
export function afterPaymentLine(
  leftMinor: number,
  amountMinor: number | null,
  money: (minor: number) => string,
): string {
  const setAside = `${money(Math.max(leftMinor, 0))} set aside`;
  if (amountMinor === null) return setAside;
  const after = leftMinor - amountMinor;
  return after >= 0
    ? `${setAside} · ${money(after)} left after`
    : `${setAside} · ${money(-after)} over after`;
}

/** What happens to the envelope once this one is paid. */
export function nextDueLine(
  envelope: Pick<V2Envelope, "dueDate" | "repeat" | "targetMinor">,
  money: (minor: number) => string,
): string {
  const next = envelope.dueDate ? nextDueDate(envelope.dueDate, envelope.repeat) : null;
  if (next === null) return "This is a one-off, so its target is cleared once it's paid.";
  const target = envelope.targetMinor === null ? "" : ` for ${money(envelope.targetMinor)}`;
  return `Next one is due ${format(parseISO(next), "d MMM yyyy")}${target}.`;
}
