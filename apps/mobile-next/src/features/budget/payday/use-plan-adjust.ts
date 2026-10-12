import { useState } from "react";

import { useLedgerMutations } from "@/data/ledger-queries";
import { decimalFromMinor } from "@/utils/money";

import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import { envelopeLines, type ActiveBudgetView, type EnvelopeLine } from "../home/home-model";

import { checkAdjust, type AdjustDraft, type AdjustResult } from "./adjust-plan-model";

export interface PlanAdjust {
  readonly lines: readonly EnvelopeLine[];
  /** What a row shows: the typed amount, else this period's plan. */
  readonly valueOf: (line: EnvelopeLine) => string;
  readonly setValue: (envelopeId: string, text: string) => void;
  readonly result: AdjustResult;
  readonly busy: boolean;
  readonly error: string | undefined;
  /** Writes every changed plan in one batch; true when it went through or nothing changed. */
  readonly save: () => Promise<boolean>;
}

/** Adjust amounts on Plan new month: one typed amount per envelope, saved together. */
export function usePlanAdjust(view: ActiveBudgetView): PlanAdjust {
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const [draft, setDraft] = useState<AdjustDraft>({});
  const currency = view.budget.currency;
  const lines = envelopeLines(view);
  const result = checkAdjust(
    lines.map(({ envelope, totals }) => ({
      envelopeId: envelope.id,
      name: envelope.name,
      plannedMinor: totals.plannedMinor,
      leftMinor: totals.leftMinor,
    })),
    draft,
    currency,
    view.current.unassignedMinor,
  );

  return {
    lines,
    valueOf: ({ envelope, totals }) =>
      draft[envelope.id] ?? decimalFromMinor(Math.max(totals.plannedMinor, 0), currency),
    setValue: (envelopeId, text) => {
      write.clearError();
      setDraft((current) => ({ ...current, [envelopeId]: text }));
    },
    result,
    busy: write.busy,
    error: write.error,
    save: async () => {
      const input = result.input;
      if (!input) return result.problem === null;
      const ok = await write.run(() => createAssignments(input));
      if (ok) setDraft({});
      return ok;
    },
  };
}
