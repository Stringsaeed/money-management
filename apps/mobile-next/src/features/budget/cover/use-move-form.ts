import { useState } from "react";

import { track } from "@/features/analytics";
import { useLedgerMutations } from "@/data/ledger-queries";
import { showToast } from "@/ui/trove";
import { decimalFromMinor, parseMoneyMinor } from "@/utils/money";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { moveQuickPicks } from "./move-display";
import {
  moveHint,
  moveInput,
  placesFrom,
  resolveMove,
  UNPLANNED_KEY,
  type Place,
} from "./cover-move-model";

export type MoveEnd = "from" | "to";

interface UseMoveFormOptions {
  readonly view: ActiveBudgetView;
  /** Envelope to take from; `null` starts at Not planned yet. */
  readonly fromId: string | null;
  /** Envelope to move into, when the caller already knows it. */
  readonly toId?: string | null;
  readonly onDone: () => void;
}

/** An overspent destination starts with its overspend, as far as the source can give. */
function startingText(from: Place | undefined, to: Place | undefined, currency: string): string {
  if (!from || !to || to.availableMinor >= 0) return "";
  const minor = Math.min(-to.availableMinor, Math.max(from.availableMinor, 0));
  return minor > 0 ? decimalFromMinor(minor, currency) : "";
}

/** O3: two places and an amount, capped at what the source has left. */
export function useMoveForm({ view, fromId, toId, onDone }: UseMoveFormOptions) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const lines = envelopeLines(view);
  const places = placesFrom(lines, view.current.unassignedMinor);
  const [fromKey, setFromKey] = useState(fromId ?? UNPLANNED_KEY);
  const [toKey, setToKey] = useState<string | null>(toId ?? null);
  const [picking, setPicking] = useState<MoveEnd | null>(null);
  const [text, setText] = useState(() =>
    startingText(
      places.find((place) => place.key === (fromId ?? UNPLANNED_KEY)),
      places.find((place) => place.key === toId),
      currency,
    ),
  );

  const amountMinor = parseMoneyMinor(text.trim(), currency);
  const { from, to, preview, capMinor } = resolveMove(places, fromKey, toKey, amountMinor);

  const choose = (end: MoveEnd, key: string) => {
    write.clearError();
    if (end === "from") setFromKey(key);
    else setToKey(key);
    setPicking(null);
  };

  const swap = () => {
    if (!toKey) return;
    write.clearError();
    setFromKey(toKey);
    setToKey(fromKey);
  };

  const changeText = (value: string) => {
    write.clearError();
    setText(value);
  };

  const move = async () => {
    if (!from || !to || preview?.status !== "ok" || amountMinor === null) return;
    const ok = await write.run(() => createAssignments(moveInput(from, to, amountMinor)));
    if (!ok) return;
    track("money_moved", {});
    showToast({ message: `Moved ${money(amountMinor)} to ${to.name}` });
    onDone();
  };

  return {
    lines,
    places,
    from,
    to,
    text,
    amountMinor,
    capMinor,
    ready: preview?.status === "ok",
    hint: from ? moveHint({ from, to, text, amountMinor, money }) : null,
    quickPicks: moveQuickPicks(to, capMinor, currency),
    pickAmount: (minor: number) => changeText(decimalFromMinor(minor, currency)),
    picking,
    togglePicker: (end: MoveEnd) => setPicking((current) => (current === end ? null : end)),
    choose,
    swap,
    changeText,
    move: () => void move(),
    busy: write.busy,
    error: write.error,
  };
}
