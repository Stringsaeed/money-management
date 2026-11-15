import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

export interface SetupPreset {
  readonly name: string;
  readonly group: V2EnvelopeGroup;
  /** Shown on the preset's chip and amount row until a Category with its own emoji exists. */
  readonly emoji: string;
}

/** UAE presets offered in What it's for (#367 S3). Big yearly or quarterly payments are Saving for. */
export const SETUP_PRESETS: readonly SetupPreset[] = [
  { name: "DEWA", group: "bills", emoji: "💡" },
  { name: "du/Etisalat", group: "bills", emoji: "📶" },
  { name: "Send home", group: "bills", emoji: "💸" },
  { name: "Groceries", group: "everyday", emoji: "🛒" },
  { name: "Fuel & Salik", group: "everyday", emoji: "⛽" },
  { name: "Dining & coffee", group: "everyday", emoji: "🍽️" },
  { name: "Personal & fun", group: "everyday", emoji: "🎈" },
  { name: "Rent cheque", group: "saving", emoji: "🏠" },
  { name: "School fees", group: "saving", emoji: "🎒" },
  { name: "Ramadan & Eid", group: "saving", emoji: "🌙" },
  { name: "Emergency cushion", group: "saving", emoji: "🛟" },
];
