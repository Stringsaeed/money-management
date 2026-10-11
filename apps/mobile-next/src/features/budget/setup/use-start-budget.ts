import { useRef, useState } from "react";

import type { V2BudgetActivateInput } from "@trove/api/v2/contracts";

import { ApiError } from "@/data/http";
import { budgetKey, useLedgerData, useSelectedBudget } from "@/data/ledger-queries";
import { track } from "@/features/analytics";
import { useLedgerMutationsWithSound } from "@/features/sound/use-ledger-mutations-with-sound";

import { currencyErrorMessage } from "../currency/currency-errors";
import { roleErrorMessage } from "../role/budget-role";

const FALLBACK_MESSAGE =
  "Couldn't start your budget. Your plan is saved on this device. Check your connection and retry.";

function failureMessage(error: ApiError | null): string {
  const refused = roleErrorMessage(error);
  if (refused) return refused;
  if (error?.code === "budget_overplanned") {
    return "Your plan uses more than you have. Go back, lower some amounts, and try again.";
  }
  const currency = currencyErrorMessage(error);
  if (currency) return currency;
  return error?.message || FALLBACK_MESSAGE;
}

/**
 * Sends the one activation request. A second press while one is in flight does nothing, and a
 * retry of the same plan reuses the same request key, so it can never create two budgets.
 */
export function useStartBudget(onStarted: () => void) {
  const { identityKey, queryClient, scope } = useLedgerData();
  const { activateBudget } = useLedgerMutationsWithSound();
  const { budgets, select } = useSelectedBudget();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (input: V2BudgetActivateInput & { readonly currency: string }) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await activateBudget(input);
      // The new budget is the one the person sees next.
      await select(input.currency);
      track("budget_activated", {
        envelope_count: input.envelopes.length,
        groups: new Set(input.envelopes.map((envelope) => envelope.group)).size,
        currency_count: budgets.length + 1,
      });
      onStarted();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "budget_already_active") {
        // An earlier attempt did land: show the budget it created instead of an error.
        await queryClient.invalidateQueries({ queryKey: budgetKey(identityKey, scope) });
        await select(input.currency);
        onStarted();
      } else {
        setError(failureMessage(cause instanceof ApiError ? cause : null));
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { start, pending, error };
}
