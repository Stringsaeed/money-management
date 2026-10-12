import { useState } from "react";
import { Alert } from "react-native";

import { track } from "@/features/analytics";
import { useLedgerMutations } from "@/data/ledger-queries";
import { showToast } from "@/ui/trove";

import { useBudgetMoney } from "../currency/use-budget-currency";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { coverToast } from "./cover-copy";
import {
  allocateCover,
  coverMode,
  coverSources,
  coverWrite,
  defaultCoverSelection,
  placesFrom,
  type CoverRequest,
} from "./cover-move-model";

interface UseCoverFormOptions {
  readonly view: ActiveBudgetView;
  readonly request: CoverRequest;
  readonly onCovered?: (targetId: string) => void;
  readonly onDone: () => void;
}

/**
 * O2, B1 and C1: which sources a cover takes from and the write it makes. Nothing moves until
 * Move, and the previews are the same arithmetic the server applies to the same Left values.
 */
export function useCoverForm({ view, request, onCovered, onDone }: UseCoverFormOptions) {
  const money = useBudgetMoney();
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const { targetId } = request;
  const mode = coverMode(request);
  const lines = envelopeLines(view);
  const target = lines.find((line) => line.envelope.id === targetId);
  const amountMinor = request.amountMinor ?? Math.max(-(target?.totals.leftMinor ?? 0), 0);
  const ranked = coverSources(mode, placesFrom(lines, view.current.unassignedMinor), targetId);
  const [selected, setSelected] = useState(() => defaultCoverSelection(ranked, amountMinor));
  const plan = allocateCover(ranked, selected, amountMinor);

  const toggle = (key: string) => {
    write.clearError();
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const move = async () => {
    if (!target) return;
    const ok = await write.run(() => createAssignments(coverWrite(mode, targetId, plan)));
    if (!ok) return;
    const source = plan.takes[0]?.place.kind;
    track("overspend_covered", {
      source_type: source === "unplanned" ? "unassigned" : (source ?? "unassigned"),
    });
    showToast({ message: coverToast(mode, target.envelope.name, plan.coveredMinor, money) });
    onCovered?.(targetId);
    onDone();
  };

  /** Savings are set aside for a bigger payment, so taking from them asks first. */
  const confirmAndMove = () => {
    if (!plan.takesFromSaving) return void move();
    const names = plan.takes
      .filter((take) => take.place.kind === "saving")
      .map((take) => take.place.name)
      .join(", ");
    Alert.alert(
      "Take from savings?",
      `${names} is set aside for a bigger payment. Move ${money(plan.coveredMinor)} out of savings?`,
      [
        { text: "Keep savings", style: "cancel" },
        { text: "Move it", style: "destructive", onPress: () => void move() },
      ],
    );
  };

  return {
    mode,
    lines,
    target,
    amountMinor,
    ranked,
    selected,
    plan,
    toggle,
    confirmAndMove,
    busy: write.busy,
    error: write.error,
  };
}
