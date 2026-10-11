import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ledgerClient } from "@/data/ledger-client";
import { budgetKey, useLedgerData } from "@/data/ledger-queries";
import { createRequestKeyRunner } from "@/data/request-keys";
import { showToast } from "@/ui/toast";

import { writeErrorMessage } from "../envelope/envelope-model";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import type { ActiveBudgetView } from "../home/home-model";

import { checkShare, lacksShareEnvelope } from "./share-model";

const PERSONAL = { kind: "personal" } as const;

/** Declined this launch. Not stored: the card comes back next time, which is what opt-in means. */
const declined = new Set<string>();

/**
 * The opt-in "Household share" Bills envelope in the caller's own Personal budget. Offered only
 * while the Personal budget exists and lacks one; with no Personal budget there is nothing to offer.
 * Reads and writes the Personal ledger directly and leaves the household data alone.
 */
export function useHouseholdShare() {
  const { identityKey, queryClient, scope } = useLedgerData();
  const personalKey = [...budgetKey(identityKey, PERSONAL), "view"] as const;
  const personal = useQuery({
    queryKey: personalKey,
    queryFn: () => ledgerClient.budget.get(PERSONAL),
    enabled: scope.kind === "household",
    staleTime: 15_000,
    retry: 1,
  });
  const [runWithRequestKey] = useState(createRequestKeyRunner);
  const write = useEnvelopeWrite(writeErrorMessage);
  const [amountText, setAmountText] = useState("");
  const [hidden, setHidden] = useState(() => declined.has(identityKey));

  const view: ActiveBudgetView | null = personal.data?.budget ? personal.data : null;
  const check = view ? checkShare(amountText, view.current.unassignedMinor) : null;
  const offered = !hidden && view !== null && lacksShareEnvelope(view);

  const add = async () => {
    if (!check?.ok) return;
    const { input } = check;
    const ok = await write.run(async () => {
      await runWithRequestKey("household-share", JSON.stringify(input), (requestKey) =>
        ledgerClient.budget.createEnvelope(PERSONAL, input, { requestKey }),
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
