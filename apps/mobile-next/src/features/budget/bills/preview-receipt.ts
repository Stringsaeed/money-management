import { format, parseISO } from "date-fns";

import type { V2EnvelopeRepeat } from "@trove/api/v2/contracts";
import { compactAmount, type ReceiptTotalTone } from "@/ui/trove";

import { nextDueDate, type SavingPreview } from "./big-payment-model";
import { codeAmount } from "./bills-copy";

export interface PreviewReceiptLine {
  readonly label: string;
  readonly value: string;
}

export interface PreviewReceipt {
  readonly lines: readonly PreviewReceiptLine[];
  readonly total: PreviewReceiptLine & { readonly tone: Extract<ReceiptTotalTone, "ok" | "warn"> };
  readonly sentence: string;
}

const stamp = (date: string) => format(parseISO(date), "d MMM").toUpperCase();
const day = (date: string) => format(parseISO(date), "d MMM");

/** "PAYDAYS · 25 OCT, 25 NOV", "PAYDAYS · 25 OCT – 25 MAR", or "PAYDAYS BEFORE 20 OCT". */
function paydaysLine(preview: SavingPreview, dueDate: string): PreviewReceiptLine {
  const dates = preview.paydayDates;
  const first = dates[0];
  const last = dates.at(-1);
  if (first === undefined || last === undefined) {
    return { label: `PAYDAYS BEFORE ${stamp(dueDate)}`, value: "0" };
  }
  const label =
    dates.length <= 2
      ? `PAYDAYS · ${dates.map(stamp).join(", ")}`
      : `PAYDAYS · ${stamp(first)} – ${stamp(last)}`;
  return { label, value: `÷ ${dates.length}` };
}

/** What happens after this one is paid, in the receipt's closing sentence. */
function afterSentence(dueDate: string, repeat: V2EnvelopeRepeat): string {
  const next = nextDueDate(dueDate, repeat);
  if (next === null) return "It's a one-off, so its target clears once it's paid.";
  return `After ${day(dueDate)}, the next one (${day(next)}) starts at 0 and we work it out again.`;
}

/** B2's receipt for what is typed so far: still needed, paydays, and the per-payday total. */
export function previewReceipt(input: {
  readonly preview: SavingPreview;
  readonly dueDate: string;
  readonly repeat: V2EnvelopeRepeat;
  readonly currency: string;
}): PreviewReceipt {
  const { preview, dueDate, repeat, currency } = input;
  const stillNeeded = {
    label: "STILL NEEDED",
    value: compactAmount(preview.stillNeededMinor, currency),
  };
  if (preview.shortBeforePaydayMinor !== null) {
    return {
      lines: [stillNeeded, { label: `PAYDAYS BEFORE ${stamp(dueDate)}`, value: "0" }],
      total: {
        label: `SHORT ON ${stamp(dueDate)}`,
        value: codeAmount(preview.shortBeforePaydayMinor, currency),
        tone: "warn",
      },
      sentence:
        "It's due before you're paid. Move money in from another envelope now, or it shows as overspend on the day.",
    };
  }
  return {
    lines: [stillNeeded, paydaysLine(preview, dueDate)],
    total: {
      label: "SET ASIDE EACH PAYDAY",
      value: codeAmount(preview.perPaydayMinor, currency),
      tone: "ok",
    },
    sentence:
      preview.perPaydayMinor === 0
        ? "It's already fully set aside, so nothing more goes in each payday."
        : afterSentence(dueDate, repeat),
  };
}
