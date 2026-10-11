import { useState } from "react";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

import { track } from "@/features/analytics";
import { useLedgerMutations } from "@/data/ledger-queries";
import { todayDateKey } from "@/utils/date";
import { decimalFromMinor } from "@/utils/money";

import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";
import { paidWithAccounts, resolveDefaultAccountId } from "../quick-add/quick-add-model";

import { checkPayment, payErrorMessage } from "./big-payment-model";

interface UseMarkPaidFormOptions {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly accounts: readonly V2Account[];
  readonly onPaid: (amountMinor: number) => void;
}

/** State and save for Mark big payment paid. Funding accounts only, so Left drops as expected. */
export function useMarkPaidForm({ view, line, accounts, onPaid }: UseMarkPaidFormOptions) {
  const { payEnvelope } = useLedgerMutations();
  const write = useEnvelopeWrite(payErrorMessage);
  const { funding } = paidWithAccounts(accounts, view.fundingAccountIds);
  const [amountText, setAmountText] = useState(
    decimalFromMinor(line.envelope.targetMinor ?? 0, BUDGET_CURRENCY),
  );
  const [accountOverride, setAccountOverride] = useState<string | null>(null);
  const [date, setDate] = useState(todayDateKey);

  const accountId =
    accountOverride ??
    resolveDefaultAccountId(
      funding.map((account) => account.id),
      null,
      view.budget.defaultAccountId,
    );
  const check = checkPayment({ amountText, accountId, date });

  const edit =
    <T>(set: (value: T) => void) =>
    (value: T) => {
      write.clearError();
      set(value);
    };

  const submit = async () => {
    if (!check.ok) return;
    const ok = await write.run(() => payEnvelope(line.envelope.id, check.input));
    if (!ok) return;
    track("bill_marked_paid", {});
    onPaid(check.input.amountMinor);
  };

  return {
    funding,
    amountText,
    setAmountText: edit(setAmountText),
    accountId,
    selectAccount: edit(setAccountOverride),
    date,
    setDate: edit(setDate),
    amountMinor: check.ok ? check.input.amountMinor : null,
    problem: check.ok ? "" : check.message,
    busy: write.busy,
    error: write.error,
    submit,
  };
}
