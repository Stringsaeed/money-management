import type { V2Account, V2DueOccurrence } from "@trove/api/v2/contracts";

import type { Readiness } from "./due-readiness";

/** What every Due section needs to draw and act on a bill, built once per render of the list. */
export interface DueBillsView {
  readonly today: string;
  readonly budgetCurrency: string;
  readonly readiness: (item: V2DueOccurrence) => Readiness;
  readonly iconFor: (categoryId: string | null) => string | null;
  /** Where this bill can be paid from; see `markPaidAccounts`. */
  readonly accountsFor: (item: V2DueOccurrence) => readonly V2Account[];
  readonly accountName: (accountId: string) => string | null;
  /** Compact money for notes: "AED 75". */
  readonly money: (minor: number) => string;
  readonly isMuted: (ruleId: string) => boolean;
  /** False for a read-only viewer: no Mark paid, Skip or editing. */
  readonly canPay: boolean;
  readonly openMarkPaid: (item: V2DueOccurrence) => void;
  readonly snooze: (item: V2DueOccurrence) => void;
  readonly skip: (item: V2DueOccurrence) => void;
}
