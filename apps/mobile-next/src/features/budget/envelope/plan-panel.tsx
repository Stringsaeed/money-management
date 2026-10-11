import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useLedgerMutations } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";
import { showToast } from "@/ui/toast";
import { decimalFromMinor, formatMoneyMinor, parseMoneyMinor } from "@/utils/money";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { planChange } from "./envelope-model";
import { PanelError } from "./panel-error";
import { PanelHeader } from "./panel-header";
import { useEnvelopeWrite } from "./use-envelope-write";

interface PlanPanelProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly onBack: () => void;
  readonly onDone: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** Change plan: type the new monthly amount; the difference moves from or to Not planned yet. */
export function PlanPanel({ view, line, onBack, onDone }: PlanPanelProps) {
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const { totals, envelope } = line;
  const [text, setText] = useState(decimalFromMinor(totals.plannedMinor, BUDGET_CURRENCY));
  const next = parseMoneyMinor(text, BUDGET_CURRENCY);
  const change =
    next === null || next < 0
      ? null
      : planChange({
          envelopeId: envelope.id,
          plannedMinor: totals.plannedMinor,
          leftMinor: totals.leftMinor,
          unassignedMinor: view.current.unassignedMinor,
          nextPlannedMinor: next,
        });

  const hint =
    change === null
      ? "Enter an amount like 350 or 350.50."
      : change.kind === "over_unplanned"
        ? `Not planned yet only has ${money(change.maxPlannedMinor - totals.plannedMinor)}. Plan up to ${money(change.maxPlannedMinor)}.`
        : change.kind === "below_spent"
          ? `${money(totals.plannedMinor - change.minPlannedMinor)} is left to take back. Plan at least ${money(change.minPlannedMinor)}.`
          : `Not planned yet: ${money(view.current.unassignedMinor)}`;
  const invalid =
    change === null || change.kind === "over_unplanned" || change.kind === "below_spent";

  const save = async () => {
    if (change?.kind === "same") return onDone();
    if (change?.kind !== "ok") return undefined;
    const ok = await write.run(() => createAssignments(change.input));
    if (ok) {
      showToast({ message: `${envelope.name} plan is now ${money(next ?? 0)}` });
      onDone();
    }
    return undefined;
  };

  return (
    <View style={styles.container}>
      <PanelHeader title="Change plan" onBack={onBack} />
      <TextField
        label={`${envelope.name} this period`}
        keyboardType="decimal-pad"
        value={text}
        onChangeText={(value) => {
          write.clearError();
          setText(value);
        }}
      />
      <Text variant="caption" accessibilityLiveRegion="polite">
        {hint}
      </Text>
      <PanelError message={write.error} />
      <Button title="Save" loading={write.busy} disabled={invalid} onPress={() => void save()} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing[3] } });
