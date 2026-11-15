import type { TextTone } from "@/ui/trove";

import { dayOrdinal } from "./due-display";
import type { Readiness } from "./due-readiness";

export interface ToneCopy {
  readonly text: string;
  readonly tone: Extract<TextTone, "secondary" | "tertiary" | "warning">;
}

interface RowNoteInput {
  readonly readiness: Readiness;
  readonly scheduledDate: string;
  /** The bill's account, for a bill no envelope covers. */
  readonly accountName: string | null;
  readonly muted: boolean;
  readonly money: (minor: number) => string;
}

function baseNote({ readiness, scheduledDate, accountName, money }: RowNoteInput): ToneCopy {
  switch (readiness.kind) {
    case "short":
      return {
        text: `Envelope short ${money(readiness.shortMinor)} · cover before ${dayOrdinal(scheduledDate)}`,
        tone: "warning",
      };
    case "ready":
      return { text: `${readiness.envelope} envelope ready ✓`, tone: "secondary" };
    case "none":
      return {
        text: accountName ? `From ${accountName}` : "Not in an envelope",
        tone: "secondary",
      };
  }
}

/** The line under a pending bill: is its envelope ready, and are its reminders muted. */
export function dueRowNote(input: RowNoteInput): ToneCopy {
  const note = baseNote(input);
  return input.muted ? { ...note, text: `${note.text} · reminders muted` } : note;
}

interface CardSubInput {
  readonly readiness: Readiness;
  readonly accountName: string | null;
  readonly money: (minor: number) => string;
}

/** The mono line under a bill due now: "BILLS · ENVELOPE READY ✓". */
export function dueCardSub({ readiness, accountName, money }: CardSubInput): ToneCopy {
  switch (readiness.kind) {
    case "ready":
      return { text: `${readiness.envelope} · envelope ready ✓`.toUpperCase(), tone: "tertiary" };
    case "short":
      return {
        text: `${readiness.envelope} · short ${money(readiness.shortMinor)}`.toUpperCase(),
        tone: "warning",
      };
    case "none":
      return {
        text: (accountName ? `From ${accountName}` : "Not in an envelope").toUpperCase(),
        tone: "tertiary",
      };
  }
}

/** Under the Mark paid receipt: does the envelope cover this payment. */
export function markPaidNote(
  envelope: string,
  afterMinor: number,
  money: (minor: number) => string,
): string {
  return afterMinor >= 0
    ? `Paid from what ${envelope} has left.`
    : `${envelope} will be ${money(-afterMinor)} over after this.`;
}
