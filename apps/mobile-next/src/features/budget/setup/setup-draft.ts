import { z } from "zod";

import { envelopeGroupSchema, paydayRuleSchema } from "@trove/api/v2/contracts";

import type { SetupDraft } from "./setup-types";

export const emptySetupDraft = (): SetupDraft => ({
  step: "payday",
  payday: null,
  usualSalary: "",
  paydayReminder: true,
  openingCash: "",
  funding: {},
  selection: {},
  custom: [],
  amounts: {},
});

const draftSchema = z.object({
  step: z.enum(["payday", "items", "amounts", "review"]),
  payday: paydayRuleSchema.nullable(),
  usualSalary: z.string(),
  paydayReminder: z.boolean(),
  openingCash: z.string(),
  funding: z.record(z.string(), z.boolean()),
  selection: z.record(z.string(), z.boolean()),
  custom: z.array(z.object({ name: z.string(), group: envelopeGroupSchema })),
  amounts: z.record(z.string(), z.string()),
});

const STORED_VERSION = 1;

export const serializeSetupDraft = (draft: SetupDraft): string =>
  JSON.stringify({ version: STORED_VERSION, draft });

/** A damaged or outdated stored draft reads as no draft rather than breaking setup. */
export function parseSetupDraft(raw: string | null): SetupDraft | null {
  if (!raw) return null;
  try {
    const stored = z
      .object({ version: z.literal(STORED_VERSION), draft: draftSchema })
      .safeParse(JSON.parse(raw));
    return stored.success ? stored.data.draft : null;
  } catch {
    return null;
  }
}
