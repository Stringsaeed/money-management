import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

export interface SetupPreset {
  readonly name: string;
  readonly group: V2EnvelopeGroup;
}

/** UAE presets offered in What it's for (#367 S3). Big yearly or quarterly payments are Saving for. */
export const SETUP_PRESETS: readonly SetupPreset[] = [
  { name: "DEWA", group: "bills" },
  { name: "du/Etisalat", group: "bills" },
  { name: "Send home", group: "bills" },
  { name: "Groceries", group: "everyday" },
  { name: "Fuel & Salik", group: "everyday" },
  { name: "Dining & coffee", group: "everyday" },
  { name: "Personal & fun", group: "everyday" },
  { name: "Rent cheque", group: "saving" },
  { name: "School fees", group: "saving" },
  { name: "Ramadan & Eid", group: "saving" },
  { name: "Emergency cushion", group: "saving" },
];
