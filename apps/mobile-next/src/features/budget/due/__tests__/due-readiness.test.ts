import type { V2DueOccurrence, V2Envelope } from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../../home/home-model";
import { dueCardSub, dueRowNote, markPaidNote } from "../due-copy";
import { billEnvelope, billReadiness } from "../due-readiness";

const bill = (
  ruleId: string,
  scheduledDate: string,
  overrides: Partial<V2DueOccurrence> = {},
): V2DueOccurrence => ({
  ruleId,
  name: ruleId,
  scheduledDate,
  amountMinor: 100_00,
  currency: "AED",
  accountId: "acc",
  categoryId: "cat-bills",
  kind: "expense",
  overdue: false,
  ...overrides,
});

const envelope: V2Envelope = {
  id: "env",
  name: "Bills",
  group: "bills",
  startFresh: false,
  targetMinor: null,
  dueDate: null,
  repeat: null,
  archived: false,
  sortOrder: 0,
  categoryIds: ["cat-bills"],
  version: 1,
};

const line = (leftMinor: number): EnvelopeLine => ({
  envelope,
  totals: {
    id: "env",
    plannedMinor: leftMinor,
    budgetedMinor: leftMinor,
    spentMinor: 0,
    rolloverMinor: 0,
    leftMinor,
  },
});

const money = (minor: number) => `AED ${minor / 100}`;

describe("billEnvelope", () => {
  it("finds the envelope the bill's Category maps to", () => {
    expect(billEnvelope(bill("a", "2026-10-11"), [line(0)], "AED")?.envelope.name).toBe("Bills");
  });

  it("has none for another currency or no Category", () => {
    expect(billEnvelope(bill("a", "2026-10-11", { currency: "USD" }), [line(0)], "AED")).toBeNull();
    expect(
      billEnvelope(bill("a", "2026-10-11", { categoryId: null }), [line(0)], "AED"),
    ).toBeNull();
  });
});

describe("billReadiness", () => {
  it("shares what an envelope has left between its bills, earliest first", () => {
    const result = billReadiness(
      [bill("later", "2026-10-18", { amountMinor: 150_00 }), bill("first", "2026-10-11")],
      [line(175_00)],
      "AED",
    );
    expect(result.get("first|2026-10-11")).toEqual({ kind: "ready", envelope: "Bills" });
    expect(result.get("later|2026-10-18")).toEqual({
      kind: "short",
      envelope: "Bills",
      shortMinor: 75_00,
    });
  });

  it("is short by at most the bill itself", () => {
    const result = billReadiness([bill("a", "2026-10-11")], [line(-500_00)], "AED");
    expect(result.get("a|2026-10-11")).toMatchObject({ shortMinor: 100_00 });
  });

  it("marks bills no envelope covers", () => {
    const result = billReadiness([bill("a", "2026-10-11", { categoryId: null })], [], "AED");
    expect(result.get("a|2026-10-11")).toEqual({ kind: "none" });
  });
});

describe("due copy", () => {
  it("warns when the envelope is short, naming the day to cover by", () => {
    expect(
      dueRowNote({
        readiness: { kind: "short", envelope: "Bills", shortMinor: 75_00 },
        scheduledDate: "2026-10-18",
        accountName: "ENBD",
        muted: false,
        money,
      }),
    ).toEqual({ text: "Envelope short AED 75 · cover before 18th", tone: "warning" });
  });

  it("says when reminders are muted", () => {
    expect(
      dueRowNote({
        readiness: { kind: "ready", envelope: "Bills" },
        scheduledDate: "2026-10-18",
        accountName: null,
        muted: true,
        money,
      }).text,
    ).toBe("Bills envelope ready ✓ · reminders muted");
  });

  it("prints the card's sub line in caps", () => {
    expect(
      dueCardSub({ readiness: { kind: "ready", envelope: "Bills" }, accountName: null, money }),
    ).toEqual({ text: "BILLS · ENVELOPE READY ✓", tone: "tertiary" });
    expect(
      dueCardSub({ readiness: { kind: "none" }, accountName: "ENBD Current", money }).text,
    ).toBe("FROM ENBD CURRENT");
  });

  it("explains the receipt's outcome", () => {
    expect(markPaidNote("Bills", 0, money)).toBe("Paid from what Bills has left.");
    expect(markPaidNote("Bills", -75_00, money)).toBe("Bills will be AED 75 over after this.");
  });
});
