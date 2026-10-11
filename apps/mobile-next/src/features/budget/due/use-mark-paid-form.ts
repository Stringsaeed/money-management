import { useState } from "react";

import type { V2Account, V2DueOccurrence } from "@trove/api/v2/contracts";

import { track } from "@/features/analytics";
import { useLedgerMutationsWithSound } from "@/features/sound";
import { showToast } from "@/ui/trove";
import { decimalFromMinor } from "@/utils/money";

import { checkMarkPaid, markPaidDefaultAccountId, occurrenceErrorMessage } from "./mark-paid-model";

interface UseMarkPaidFormOptions {
  readonly item: V2DueOccurrence;
  readonly accounts: readonly V2Account[];
  readonly today: string;
  readonly onPaid: () => void;
}

/**
 * Amount and account start as the bill says (account only when it is one the budget counts), the
 * date starts today; Save posts them as this payment only.
 */
export function useMarkPaidForm({ item, accounts, today, onPaid }: UseMarkPaidFormOptions) {
  const mutations = useLedgerMutationsWithSound();
  const [amountText, setAmountText] = useState(decimalFromMinor(item.amountMinor, item.currency));
  const [pickedAccountId, setAccountId] = useState<string | null>(null);
  const accountId = pickedAccountId ?? markPaidDefaultAccountId(accounts, item);
  const [date, setDate] = useState(today);
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
    track("bill_marked_paid", {});
    showToast({ message: `Marked ${item.name} as paid` });
    onPaid();
  };

  return { amountText, setAmountText, accountId, setAccountId, date, setDate, busy, error, submit };
}
