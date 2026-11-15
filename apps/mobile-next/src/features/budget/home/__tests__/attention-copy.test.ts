import type { V2BudgetActivityItem } from "@trove/api/v2/contracts";

import type { Attention, AttentionItem } from "../attention";
import { attentionAction, attentionLink } from "../attention-action";
import { attentionCopy, attentionSub } from "../attention-copy";

const context = {
  money: (minor: number) => `AED ${(minor / 100).toLocaleString("en-US")}`,
  now: new Date("2026-10-11T10:00:00.000Z"),
};

const dueToday: AttentionItem = {
  kind: "due_today",
  count: 1,
  totalMinor: 185_000,
  name: "Car loan",
};
const notPlanned: AttentionItem = { kind: "not_planned", amountMinor: 73_000 };
const over: AttentionItem = {
  kind: "overspend",
  id: "dining",
  name: "Dining & coffee",
  count: 1,
  overMinor: 17_500,
};

const activity: V2BudgetActivityItem = {
  id: "a1",
  periodStart: "2026-09-25",
  fromEnvelopeId: null,
  fromName: null,
  toEnvelopeId: "groceries",
  toName: "Groceries",
  amountMinor: 12_000,
  reason: "plan",
  createdBy: "u1",
  createdByName: "Sara",
  createdAt: "2026-10-11T08:00:00.000Z",
};

describe("attentionCopy", () => {
  it("prints the board's titles per state", () => {
    expect(attentionCopy(dueToday, context)).toMatchObject({
      tone: "warn",
      emoji: "🧾",
      title: "Car loan · AED 1,850 due today",
    });
    expect(attentionCopy(over, context)).toMatchObject({
      tone: "neg",
      glyph: "!",
      title: "Dining & coffee is over by AED 175",
      detail: "It's coming out of Safe to spend",
    });
    expect(attentionCopy({ kind: "payday", late: false, today: true }, context)).toMatchObject({
      tone: "accent",
      emoji: "💰",
      title: "Payday today. Did your salary land?",
      detail: "Not counted until you log it",
    });
    expect(attentionCopy({ kind: "short", shortMinor: 40_000 }, context)).toMatchObject({
      tone: "neg",
      title: "Planned AED 400 more than you have",
      detail: "Lower a plan or cover it",
    });
  });

  it("counts bills when more than one is due", () => {
    expect(
      attentionCopy({ kind: "due_today", count: 2, totalMinor: 3_000, name: null }, context).title,
    ).toBe("2 bills · AED 30 due today");
  });

  it("puts the mover's initial on household activity", () => {
    expect(attentionCopy({ kind: "activity", item: activity, moreToday: 3 }, context)).toEqual({
      tone: "accent",
      glyph: "S",
      title: "Sara planned AED 120 for Groceries",
      detail: "2h ago · 3 more today",
      brief: "household activity today",
    });
  });
});

describe("attentionSub", () => {
  it("names the next item behind the top one", () => {
    const attention: Attention = { top: dueToday, next: notPlanned, moreCount: 1 };
    expect(attentionSub(attention, context)).toBe("+1 more · AED 730 not planned yet ›");
  });

  it("prints the top item's own detail when it is alone", () => {
    expect(attentionSub({ top: over, next: null, moreCount: 0 }, context)).toBe(
      "It's coming out of Safe to spend ›",
    );
    expect(attentionSub({ top: null, next: null, moreCount: 0 }, context)).toBe("");
  });
});

describe("attentionAction", () => {
  const all = { canAddSpending: true, canEditPlan: true };
  const viewer = { canAddSpending: false, canEditPlan: false };

  it("offers the board's action per state", () => {
    expect(attentionAction(dueToday, all)).toEqual({
      label: "Mark paid",
      target: { kind: "due" },
    });
    expect(attentionAction(over, all)).toEqual({
      label: "Cover it",
      target: { kind: "cover", envelopeId: "dining" },
    });
    expect(attentionAction({ kind: "payday", late: true, today: false }, all).label).toBe(
      "Got paid",
    );
    expect(attentionAction({ kind: "short", shortMinor: 1 }, all)).toEqual({
      label: "Adjust",
      target: { kind: "plan" },
    });
  });

  it("gives a role that cannot act a View pill to the same place as the link", () => {
    expect(attentionAction(over, viewer)).toEqual({
      label: "View",
      target: attentionLink(over),
    });
    expect(attentionAction({ kind: "short", shortMinor: 1 }, viewer).target).toEqual({
      kind: "everyday",
    });
  });
});
