import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { V2BudgetView } from "@trove/api/v2/contracts";

import { budgetOperation } from "@/data/budget-currency";
import { ledgerClient } from "@/data/ledger-client";
import { ApiError } from "@/data/http";
import { budgetKey, useLedgerData, useSelectedBudget } from "@/data/ledger-queries";
import { createRequestKeyRunner } from "@/data/request-keys";
import { showToast } from "@/ui/trove";

import { writeErrorMessage } from "../envelope/envelope-model";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import type { ActiveBudgetView } from "../home/home-model";

import { checkShare, lacksShareEnvelope } from "./share-model";

const PERSONAL = { kind: "personal" } as const;

/** Declined this launch. Not stored: the card comes back next time, which is what opt-in means. */
const declined = new Set<string>();

const NO_PERSONAL_BUDGET: V2BudgetView = { budget: null };

/** The Personal budget in `currency`, or none when the person has not started one in it. */
async function readPersonalBudget(currency: string): Promise<V2BudgetView> {
  try {
    return await ledgerClient.budget.get(PERSONAL, currency);
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) return NO_PERSONAL_BUDGET;
    throw cause;
  }
}

/** The caller's Personal budget in `currency`, read only while a household budget is on screen. */
function usePersonalBudget(currency: string | null): ActiveBudgetView | null {
  const { identityKey, scope } = useLedgerData();
  const personal = useQuery({
    queryKey: [...budgetKey(identityKey, PERSONAL), "view", currency],
    queryFn: () => readPersonalBudget(currency ?? ""),
    enabled: scope.kind === "household" && currency !== null,
    staleTime: 15_000,
    retry: 1,
  });
  return personal.data?.budget ? personal.data : null;
}

/**
 * The opt-in "Household share" Bills envelope in the caller's own Personal budget. Offered only
 * while the Personal budget exists and lacks one; with no Personal budget there is nothing to offer.
 * Reads and writes the Personal ledger directly and leaves the household data alone. The share
 * goes in the Personal budget of the household budget's currency.
 */
export function useHouseholdShare() {
  const { identityKey, queryClient } = useLedgerData();
  const { currency } = useSelectedBudget();
  const view = usePersonalBudget(currency);
  const [runWithRequestKey] = useState(createRequestKeyRunner);
  const write = useEnvelopeWrite(writeErrorMessage);
  const [amountText, setAmountText] = useState("");
  const [hidden, setHidden] = useState(() => declined.has(identityKey));

  const check =
    view && currency !== null
      ? checkShare(amountText, currency, view.current.unassignedMinor)
      : null;
  const offered = !hidden && view !== null && lacksShareEnvelope(view);

  const add = async () => {
    if (!check?.ok || currency === null) return;
    const { input } = check;
    const ok = await write.run(async () => {
      await runWithRequestKey(
        budgetOperation("household-share", currency),
        JSON.stringify(input),
        (requestKey) =>
          ledgerClient.budget.createEnvelope(PERSONAL, currency, input, { requestKey }),
      );
      await queryClient.invalidateQueries({ queryKey: budgetKey(identityKey, PERSONAL) });
    });
    if (ok) showToast({ message: "Added Household share to your Personal budget" });
  };

  return {
    offered,
    amountText,
    setAmountText: (text: string) => {
      write.clearError();
      setAmountText(text);
    },
    problem: amountText.trim() && check && !check.ok ? check.message : "",
    ready: check?.ok === true,
    busy: write.busy,
    error: write.error,
    add,
    notNow: () => {
      declined.add(identityKey);
      setHidden(true);
    },
  };
}
