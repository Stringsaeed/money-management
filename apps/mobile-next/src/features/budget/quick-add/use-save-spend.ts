import { useState } from "react";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { playCue, useLedgerMutationsWithSound } from "@/features/sound";
import { showToast } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { errorHaptic } from "../../ledger/transactions/transaction-haptics";

import {
  placementText,
  saveErrorMessage,
  type DatePlacement,
  type SpendCheck,
} from "./quick-add-model";

/** Handed to `onSaved` so a later Cover flow can open pre-filled with the overspend. */
export interface SavedSpend {
  readonly envelopeId: string;
  readonly overMinor: number;
  /** The person chose "Save & cover it". */
  readonly cover: boolean;
}

type ReadySpend = Extract<SpendCheck, { ok: true }>;

interface SaveInput {
  readonly spend: ReadySpend;
  readonly date: string;
  readonly note: string;
  readonly placement: DatePlacement;
  readonly overMinor: number;
  readonly cover: boolean;
}

interface UseSaveSpendOptions {
  readonly remember: (spend: { accountId: string; envelopeId: string }) => Promise<void>;
  readonly onSaved: (saved: SavedSpend) => void;
}

/** Saves one expense Transaction. A failure keeps the sheet open and says nothing was saved. */
export function useSaveSpend({ remember, onSaved }: UseSaveSpendOptions) {
  const mutations = useLedgerMutationsWithSound();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const fail = (message: string) => {
    errorHaptic();
    playCue("error");
    setError(message);
  };

  const save = async ({ spend, date, note, placement, overMinor, cover }: SaveInput) => {
    if (busy) return;
    setError(undefined);
    setBusy(true);
    try {
      await mutations.createTransaction({
        accountId: spend.accountId,
        categoryId: spend.categoryId,
        kind: "expense",
        amountMinor: spend.amountMinor,
        date,
        note: note.trim(),
      });
    } catch (cause) {
      const message = saveErrorMessage(cause);
      setError(message);
      showToast({ message });
      return;
    } finally {
      setBusy(false);
    }
    const { envelope } = spend;
    void remember({ accountId: spend.accountId, envelopeId: envelope.envelope.id });
    showToast({
      message:
        placementText(placement) ??
        `Added ${formatMoneyMinor(spend.amountMinor, BUDGET_CURRENCY)} to ${envelope.envelope.name}`,
    });
    onSaved({ envelopeId: envelope.envelope.id, overMinor, cover });
  };

  return { busy, error, clearError: () => setError(undefined), fail, save };
}
