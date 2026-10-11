import { addMonths, format } from "date-fns";
import { useState } from "react";

import type { V2EnvelopeRepeat } from "@trove/api/v2/contracts";

import { useLedgerMutations } from "@/data/ledger-queries";
import { todayDateKey } from "@/utils/date";

import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import type { ActiveBudgetView } from "../home/home-model";

import {
  addBigPaymentErrorMessage,
  checkBigPayment,
  previewDraft,
  type BigPaymentDraft,
} from "./big-payment-model";

const DEFAULT_LEAD_MONTHS = 3;

interface UseAddBigPaymentFormOptions {
  readonly view: ActiveBudgetView;
  readonly onAdded: (name: string) => void;
}

/** State, the live per-payday suggestion, and the save for the Add a big payment sheet. */
export function useAddBigPaymentForm({ view, onAdded }: UseAddBigPaymentFormOptions) {
  const { createEnvelope } = useLedgerMutations();
  const write = useEnvelopeWrite(addBigPaymentErrorMessage);
  const [name, setName] = useState("");
  const [amountText, setAmountText] = useState("");
  const [setAsideText, setSetAsideText] = useState("");
  const [dueDate, setDueDate] = useState(() =>
    format(addMonths(new Date(), DEFAULT_LEAD_MONTHS), "yyyy-MM-dd"),
  );
  const [repeat, setRepeat] = useState<V2EnvelopeRepeat>("once");

  const draft: BigPaymentDraft = { name, amountText, setAsideText, dueDate, repeat };
  const today = todayDateKey();
  const check = checkBigPayment(draft, { today, unassignedMinor: view.current.unassignedMinor });
  const preview = previewDraft(draft, {
    today,
    rule: view.paydayRule,
    currentPeriodStart: view.current.period.start,
  });

  /** Edits clear the last save error so it never describes values that are no longer there. */
  const edit =
    <T>(set: (value: T) => void) =>
    (value: T) => {
      write.clearError();
      set(value);
    };

  const submit = async () => {
    if (!check.ok) return;
    const ok = await write.run(() => createEnvelope(check.input));
    if (ok) onAdded(check.input.name);
  };

  return {
    name,
    amountText,
    setAsideText,
    dueDate,
    repeat,
    setName: edit(setName),
    setAmountText: edit(setAmountText),
    setSetAsideText: edit(setSetAsideText),
    setDueDate: edit(setDueDate),
    setRepeat: edit(setRepeat),
    ready: check.ok,
    problem: check.ok ? "" : check.message,
    preview,
    busy: write.busy,
    error: write.error,
    submit,
  };
}
