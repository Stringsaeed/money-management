import { format } from "date-fns";
import type { V2DueOccurrence, V2Envelope } from "@trove/api/v2/contracts";

import { compactAmount } from "@/ui/trove";
import { parseDateKey } from "@/utils/date";

import { billStatus, dueByEnvelope, savingRows } from "../bills/bills-model";
import type { EnvelopeLine } from "./home-model";

export interface TicketCopy {
  /** The headline, e.g. "2 of 4 paid". */
  readonly value: string;
  /** e.g. "next · Car loan today". */
  readonly sub: string;
}

const shortDate = (date: string) => {
  const parsed = parseDateKey(date);
  return parsed ? format(parsed, "d MMM") : date;
};

function whenDue(item: V2DueOccurrence, today: string): string {
  if (item.overdue || item.scheduledDate < today) return "overdue";
  return item.scheduledDate === today ? "today" : shortDate(item.scheduledDate);
}

export interface BillsTicketInput {
  readonly lines: readonly EnvelopeLine[];
  readonly envelopes: readonly V2Envelope[];
  /** The Due list, snoozed bills included: they are still owed. */
  readonly dueItems: readonly V2DueOccurrence[];
  readonly currency: string;
  readonly today: string;
  readonly periodEnd: string;
}

/**
 * BILLS ticket: how many Bills envelopes are paid, then the most useful next fact: nothing
 * planned yet, a bill that is short, or the next bill due.
 */
export function billsTicket(input: BillsTicketInput): TicketCopy {
  const { currency, today } = input;
  const bills = input.lines.filter((line) => line.envelope.group === "bills");
  if (bills.length === 0) return { value: "None yet", sub: "No bills planned" };

  const due = dueByEnvelope(input.dueItems, input.envelopes, currency, input.periodEnd);
  const statuses = bills.map((line) => ({
    line,
    status: billStatus(line.totals, due.get(line.envelope.id)),
  }));
  const paid = statuses.filter(({ status }) => status.kind === "paid").length;
  const value = `${paid} of ${bills.length} paid`;

  if (bills.every((line) => line.totals.plannedMinor === 0 && line.totals.spentMinor === 0)) {
    return { value, sub: "not planned yet" };
  }
  const short = statuses.find(({ status }) => status.kind === "short");
  if (short?.status.kind === "short") {
    const amount = compactAmount(short.status.shortMinor, currency);
    return { value, sub: `${short.line.envelope.name} short ${currency} ${amount}` };
  }
  // `filter` returns a copy, so sorting in place is safe (Hermes has no Array#toSorted).
  const next = input.dueItems
    .filter((item) => item.kind === "expense" && item.currency === currency)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
  if (next) return { value, sub: `next · ${next.name} ${whenDue(next, today)}` };
  return { value, sub: paid === bills.length ? "all paid" : "nothing due before payday" };
}

export interface SavingTicket extends TicketCopy {
  /** The envelope the sub line names; its emoji goes on the ticket. */
  readonly envelope: V2Envelope | null;
}

/** SAVING FOR ticket: what is set aside in total, and the soonest big payment. */
export function savingTicket(lines: readonly EnvelopeLine[], currency: string): SavingTicket {
  const rows = savingRows(lines);
  const first = rows[0];
  if (!first) return { value: "None yet", sub: "Nothing to save for", envelope: null };
  const setAside = rows.reduce((sum, row) => sum + row.setAsideMinor, 0);
  const { envelope } = first.line;
  return {
    value: setAside > 0 ? `${compactAmount(setAside, currency)} set aside` : "Plan to set aside",
    sub: envelope.dueDate ? `${envelope.name} · ${shortDate(envelope.dueDate)}` : envelope.name,
    envelope,
  };
}
