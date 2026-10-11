import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useLedgerMutations } from "@/data/ledger-queries";
import { Button, ListGroup, showToast, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { PanelError } from "../envelope/panel-error";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import {
  allocateCover,
  coverInput,
  defaultCoverSelection,
  placesFrom,
  rankCoverSources,
} from "./cover-move-model";
import { CoverNotes } from "./cover-notes";
import { CoverSourceRow } from "./cover-source-row";

interface CoverFormProps {
  readonly view: ActiveBudgetView;
  readonly targetId: string;
  readonly onDone: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/**
 * O2: choose where the money for an overspent envelope comes from. Nothing moves until Move, and
 * the "After:" numbers are the same arithmetic the server applies to the same Left values.
 */
export function CoverForm({ view, targetId, onDone }: CoverFormProps) {
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const lines = envelopeLines(view);
  const target = lines.find((line) => line.envelope.id === targetId);
  const overMinor = Math.max(-(target?.totals.leftMinor ?? 0), 0);
  const ranked = rankCoverSources(placesFrom(lines, view.current.unassignedMinor), targetId);
  const [selected, setSelected] = useState(() => defaultCoverSelection(ranked, overMinor));
  const plan = allocateCover(ranked, selected, overMinor);

  if (!target || overMinor === 0) {
    return (
      <View style={styles.container}>
        <Text variant="titleMd">Nothing to cover</Text>
        <Text variant="bodySm" tone="secondary">
          This envelope is no longer over.
        </Text>
        <Button fullWidth label="Done" variant="secondary" onPress={onDone} />
      </View>
    );
  }

  const toggle = (key: string) => {
    write.clearError();
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const move = async () => {
    const ok = await write.run(() => createAssignments(coverInput(targetId, plan)));
    if (!ok) return;
    showToast({ message: `Covered ${money(plan.coveredMinor)} for ${target.envelope.name}` });
    onDone();
  };

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

  return (
    <View style={styles.container}>
      <Text variant="titleMd" accessibilityRole="header">
        {`Cover ${target.envelope.name}`}
      </Text>
      <Text>{`${money(overMinor)} over. Pick where it comes from.`}</Text>

      {ranked.length === 0 ? (
        <Text variant="bodySm" tone="secondary">
          No envelope has money to spare right now. Nothing is moved, and the overspend comes out of
          next month&apos;s money.
        </Text>
      ) : (
        <ListGroup dividerInset={0}>
          {ranked.map((place) => (
            <CoverSourceRow
              key={place.key}
              place={place}
              selected={selected.includes(place.key)}
              take={plan.takes.find((take) => take.place.key === place.key)}
              onToggle={() => toggle(place.key)}
            />
          ))}
        </ListGroup>
      )}

      <CoverNotes
        name={target.envelope.name}
        afterLeftMinor={target.totals.leftMinor + plan.coveredMinor}
        plan={plan}
        hasSources={ranked.length > 0}
      />

      <PanelError message={write.error} />
      <Button
        fullWidth
        label={plan.coveredMinor > 0 ? `Move ${money(plan.coveredMinor)}` : "Move"}
        loading={write.busy}
        disabled={plan.coveredMinor === 0}
        onPress={confirmAndMove}
      />
      <Button fullWidth label="Not now" variant="tertiary" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
});
