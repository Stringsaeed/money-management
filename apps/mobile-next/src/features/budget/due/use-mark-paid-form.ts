import { useState } from "react";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { useLedgerMutationsWithSound } from "@/features/sound";
import { showToast } from "@/ui/toast";
import { decimalFromMinor } from "@/utils/money";

import { checkMarkPaid, occurrenceErrorMessage } from "./mark-paid-model";

/** Amount, account and date start as the bill says; Save posts them as this payment only. */
export function useMarkPaidForm(item: V2DueOccurrence, onPaid: () => void) {
  const mutations = useLedgerMutationsWithSound();
  const [amountText, setAmountText] = useState(decimalFromMinor(item.amountMinor, item.currency));
  const [accountId, setAccountId] = useState(item.accountId);
  const [date, setDate] = useState(item.scheduledDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    if (busy) return;
    const check = checkMarkPaid(item, { amountText, accountId, date });
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await mutations.payOccurrence(item.ruleId, item.scheduledDate, check.input);
    } catch (cause) {
      const message = occurrenceErrorMessage(cause, "pay");
      setError(message);
      showToast({ message });
      return;
    } finally {
      setBusy(false);
    }
    showToast({ message: `Marked ${item.name} as paid` });
    onPaid();
  };

  return { amountText, setAmountText, accountId, setAccountId, date, setDate, busy, error, submit };
}
