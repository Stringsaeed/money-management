import type { BudgetTone } from "@/ui/trove";

import { activityAgo } from "../household/activity-ago";
import { activityInitial, activitySentence } from "../household/activity-sentence";
import type { Attention, AttentionItem } from "./attention";

export interface AttentionCopyContext {
  /** Formats minor units for a sentence, e.g. "AED 1,850". */
  readonly money: (minor: number) => string;
  readonly now: Date;
}

export interface AttentionCopy {
  readonly tone: BudgetTone;
  readonly title: string;
  /** The item's own second line, without the trailing " ›". */
  readonly detail: string;
  /** How the item reads on another item's "+N more" line. */
  readonly brief: string;
  readonly emoji?: string;
  readonly glyph?: string;
}

const bills = (count: number) => `${count} ${count === 1 ? "bill" : "bills"}`;

function paydayCopy(item: Extract<AttentionItem, { kind: "payday" }>): AttentionCopy {
  return {
    tone: "accent",
    emoji: "💰",
    title: item.today
      ? "Payday today. Did your salary land?"
      : item.late
        ? "Your salary isn't logged yet"
        : "Payday. Did your salary land?",
    detail: "Not counted until you log it",
    brief: "salary not logged yet",
  };
}

function overspendCopy(
  item: Extract<AttentionItem, { kind: "overspend" }>,
  money: AttentionCopyContext["money"],
): AttentionCopy {
  const single = item.count === 1;
  return {
    tone: "neg",
    glyph: "!",
    title: single
      ? `${item.name} is over by ${money(item.overMinor)}`
      : `${item.count} envelopes are over by ${money(item.overMinor)}`,
    detail: "It's coming out of Safe to spend",
    brief: single
      ? `${item.name} over by ${money(item.overMinor)}`
      : `${item.count} envelopes over`,
  };
}

function dueTodayCopy(
  item: Extract<AttentionItem, { kind: "due_today" }>,
  money: AttentionCopyContext["money"],
): AttentionCopy {
  const who = item.count === 1 && item.name ? item.name : bills(item.count);
  return {
    tone: "warn",
    emoji: "🧾",
    title: `${who} · ${money(item.totalMinor)} due today`,
    detail: "See what's due",
    brief: `${bills(item.count)} due today`,
  };
}

function activityCopy(
  item: Extract<AttentionItem, { kind: "activity" }>,
  { money, now }: AttentionCopyContext,
): AttentionCopy {
  const ago = activityAgo(item.item.createdAt, now);
  return {
    tone: "accent",
    glyph: activityInitial(item.item),
    title: activitySentence(item.item, money),
    detail: item.moreToday > 0 ? `${ago} · ${item.moreToday} more today` : ago,
    brief: "household activity today",
  };
}

/** Tone, disc and words of an attention slot, in the Budget home board's phrasing. */
export function attentionCopy(item: AttentionItem, context: AttentionCopyContext): AttentionCopy {
  const { money } = context;
  switch (item.kind) {
    case "payday":
      return paydayCopy(item);
    case "overspend":
      return overspendCopy(item, money);
    case "short":
      return {
        tone: "neg",
        glyph: "!",
        title: `Planned ${money(item.shortMinor)} more than you have`,
        detail: "Lower a plan or cover it",
        brief: `planned ${money(item.shortMinor)} more than you have`,
      };
    case "due_error":
      return {
        tone: "warn",
        glyph: "!",
        title: "Couldn't load your bills",
        detail: "Bills due today may be missing",
        brief: "bills couldn't load",
      };
    case "due_today":
      return dueTodayCopy(item, money);
    case "not_planned":
      return {
        tone: "accent",
        emoji: "✉️",
        title: `${money(item.amountMinor)} not planned yet`,
        detail: "Give it a job",
        brief: `${money(item.amountMinor)} not planned yet`,
      };
    case "activity":
      return activityCopy(item, context);
  }
}

/**
 * The slot's second line, always a link: "+1 more · AED 730 not planned yet ›" while other
 * items wait behind the top one, otherwise the top item's own detail.
 */
export function attentionSub(attention: Attention, context: AttentionCopyContext): string {
  if (!attention.top) return "";
  if (attention.next && attention.moreCount > 0) {
    return `+${attention.moreCount} more · ${attentionCopy(attention.next, context).brief} ›`;
  }
  return `${attentionCopy(attention.top, context).detail} ›`;
}
