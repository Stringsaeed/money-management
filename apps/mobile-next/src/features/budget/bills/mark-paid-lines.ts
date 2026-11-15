import { format, parseISO } from "date-fns";

import type { V2Envelope } from "@trove/api/v2/contracts";

import { nextDueDate } from "./big-payment-model";
import { codeAmount, plainFigure } from "./bills-copy";

/** "DUE TODAY · TUE 1 DEC", "DUE MON 8 MAR", "OVERDUE · TUE 1 DEC", or "BIG PAYMENT" undated. */
export function markPaidStamp(dueDate: string | null, today: string): string {
  if (dueDate === null) return "BIG PAYMENT";
  const day = format(parseISO(dueDate), "EEE d MMM").toUpperCase();
  if (dueDate === today) return `DUE TODAY · ${day}`;
  if (dueDate < today) return `OVERDUE · ${day}`;
  return `DUE ${day}`;
}

/** "Today, 1 Dec" or "Mon 28 Nov": the paid-on date as the field prints it. */
export function paidOnLabel(date: string, today: string): string {
  const parsed = parseISO(date);
  return date === today ? `Today, ${format(parsed, "d MMM")}` : format(parsed, "EEE d MMM");
}

export interface AfterPayment {
  /** What stays in the envelope; negative once the payment is more than it holds. */
  readonly leftAfterMinor: number;
  readonly over: boolean;
}

/** The envelope's Left once `amountMinor` is paid from it. */
export function afterPayment(leftMinor: number, amountMinor: number): AfterPayment {
  const leftAfterMinor = leftMinor - amountMinor;
  return { leftAfterMinor, over: leftAfterMinor < 0 };
}

/** The receipt's total value: "0.00 ✓", "500.00", or "−500.00" when it goes over. */
export function leftAfterValue(after: AfterPayment, currency: string): string {
  if (after.over) return `−${plainFigure(after.leftAfterMinor, currency)}`;
  const figure = plainFigure(after.leftAfterMinor, currency);
  return after.leftAfterMinor === 0 ? `${figure} ✓` : figure;
}

/** What paying does to the rest of the budget. */
export function afterPaymentSentence(after: AfterPayment, currency: string): string {
  if (after.over) {
    return `That's ${codeAmount(-after.leftAfterMinor, currency)} more than is set aside. The extra shows as overspend, and you can cover it from another envelope.`;
  }
  if (after.leftAfterMinor === 0) return "Fully set aside, so Safe to spend doesn't move.";
  return `${codeAmount(after.leftAfterMinor, currency)} stays set aside, and Safe to spend doesn't move.`;
}

/** The receipt's footer: what happens to the envelope once this one is paid. */
export function nextDueNote(
  envelope: Pick<V2Envelope, "dueDate" | "repeat" | "targetMinor">,
  currency: string,
): string {
  const next = envelope.dueDate ? nextDueDate(envelope.dueDate, envelope.repeat) : null;
  if (next === null) return "ONE-OFF · TARGET CLEARS ONCE PAID";
  const date = format(parseISO(next), "d MMM yyyy").toUpperCase();
  return envelope.targetMinor === null
    ? `NEXT · ${date}`
    : `NEXT · ${date} · ${codeAmount(envelope.targetMinor, currency)}`;
}
