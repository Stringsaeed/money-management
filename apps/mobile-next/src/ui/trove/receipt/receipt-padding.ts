/** Padding inside a paper slip, in points. */
export interface ReceiptInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** The slip paddings the budgeting boards use. */
export const RECEIPT_PADDING = {
  /** Intro steps and the setup review receipt (the default). */
  intro: { top: 18, right: 18, bottom: 14, left: 18 },
  /** Receipts inside budgeting screens: envelope, plan, cover, wrap-up. */
  screen: { top: 14, right: 16, bottom: 10, left: 16 },
  /** The compact calculation receipt (`ReceiptCalc`). */
  calc: { top: 12, right: 14, bottom: 8, left: 14 },
  /** Summary tickets on Budget home. */
  ticket: { top: 12, right: 12, bottom: 8, left: 12 },
} as const satisfies Record<string, ReceiptInsets>;
