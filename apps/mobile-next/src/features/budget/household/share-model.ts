import type { V2EnvelopeCreateInput } from "@trove/api/v2/contracts";

import { parseMoneyMinor } from "@/utils/money";

import type { ActiveBudgetView } from "../home/home-model";

export const HOUSEHOLD_SHARE_NAME = "Household share";

/** The Personal budget has no active "Household share" envelope yet. */
export const lacksShareEnvelope = (personal: ActiveBudgetView): boolean =>
  !personal.envelopes.some(
    (envelope) =>
      !envelope.archived &&
      envelope.name.trim().toLowerCase() === HOUSEHOLD_SHARE_NAME.toLowerCase(),
  );

export type ShareCheck =
  | { readonly ok: true; readonly input: V2EnvelopeCreateInput }
  | { readonly ok: false; readonly message: string };

/** The typed monthly share becomes a Bills envelope in the Personal budget, planned from Not planned yet. */
export function checkShare(
  amountText: string,
  currency: string,
  unassignedMinor: number,
): ShareCheck {
  const plannedMinor = parseMoneyMinor(amountText.trim(), currency);
  if (plannedMinor === null || plannedMinor <= 0) {
    return { ok: false, message: "Enter your monthly share, like 2500 or 2500.50." };
  }
  if (plannedMinor > unassignedMinor) {
    return {
      ok: false,
      message: "That is more than your Personal budget has Not planned yet. Lower it for now.",
    };
  }
  return {
    ok: true,
    input: {
      name: HOUSEHOLD_SHARE_NAME,
      group: "bills",
      newCategory: { name: HOUSEHOLD_SHARE_NAME },
      plannedMinor,
    },
  };
}
