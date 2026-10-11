import type { V2Envelope, V2EnvelopeTotals } from "@trove/api/v2/contracts";

import type { ActiveBudgetView } from "@/features/budget/home/home-model";

export interface EnvelopeSpec {
  readonly id: string;
  readonly group: V2Envelope["group"];
  readonly categoryIds: readonly string[];
  readonly plannedMinor: number;
  readonly leftMinor: number;
  readonly spentMinor?: number;
  readonly rolloverMinor?: number;
}

/** A Sept 25 – Oct 24 budget period with the given envelopes, as `GET /budget` returns it. */
export function budgetView(envelopes: readonly EnvelopeSpec[]): ActiveBudgetView {
  return {
    budget: {
      id: "b1",
      ledgerId: "l1",
      currency: "AED",
      activationPeriodStart: "2026-09-25",
      activatedOn: "2026-09-25",
      usualSalaryMinor: 1_200_000,
      paydayReminder: true,
      defaultAccountId: null,
      version: 1,
      createdAt: "2026-09-25T00:00:00Z",
      updatedAt: "2026-09-25T00:00:00Z",
    },
    paydayRule: { kind: "day", day: 25 },
    fundingAccountIds: [],
    envelopes: envelopes.map((spec, index): V2Envelope => ({
      id: spec.id,
      name: spec.id,
      group: spec.group,
      startFresh: false,
      targetMinor: null,
      dueDate: null,
      repeat: null,
      archived: false,
      sortOrder: index,
      categoryIds: spec.categoryIds,
      version: 1,
    })),
    current: {
      period: { start: "2026-09-25", end: "2026-10-24" },
      unassignedMinor: 0,
      safeToSpendMinor: 204_630,
      perDayMinor: 14_600,
      daysLeft: 14,
      cardReserveMinor: 0,
      envelopes: envelopes.map((spec): V2EnvelopeTotals => ({
        id: spec.id,
        plannedMinor: spec.plannedMinor,
        budgetedMinor: spec.plannedMinor,
        spentMinor: spec.spentMinor ?? 0,
        rolloverMinor: spec.rolloverMinor ?? 0,
        leftMinor: spec.leftMinor,
      })),
    },
  };
}
