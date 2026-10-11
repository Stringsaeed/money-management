import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useLedgerMutations } from "@/data/ledger-queries";
import { Button, Chip, ListGroup, showToast, space } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { PanelError } from "../envelope/panel-error";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";
import { ChipRow } from "../quick-add/chip-row";
import { ChoiceRow } from "../setup/choice-row";
import { SetupFrame } from "../setup/setup-frame";

import {
  leftoverChoice,
  leftoverLines,
  leftoversInput,
  leftoverTotal,
  type LeftoverOption,
} from "./leftovers-model";
import { nextPaydayStep, paydayFlowFacts } from "./payday-flow";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** C2: what happens to Everyday money that rolled over. Keeping it (the default) writes nothing. */
export function LeftoversContent({ view }: { readonly view: ActiveBudgetView }) {
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const lines = envelopeLines(view);
  const movable = leftoverLines(lines);
  const movableMinor = movable.reduce((total, line) => total + line.amountMinor, 0);
  const savings = lines.filter((line) => line.envelope.group === "saving");

  const [option, setOption] = useState<LeftoverOption>("keep");
  const [savingId, setSavingId] = useState<string | null>(savings[0]?.envelope.id ?? null);
  const effective = leftoverChoice(option, savingId);

  const next = () => router.replace(nextPaydayStep("leftovers", paydayFlowFacts(view)));
  const apply = async () => {
    const input = leftoversInput(movable, effective);
    if (!input) return next();
    const ok = await write.run(() => createAssignments(input));
    if (!ok) return;
    showToast({
      message:
        effective.kind === "plan"
          ? `${money(movableMinor)} is now money to plan`
          : `${money(movableMinor)} moved to savings`,
    });
    next();
  };

  const pick = (choice: LeftoverOption) => {
    write.clearError();
    setOption(choice);
  };
  const cannotMove = movableMinor === 0 ? "You've already spent it this month." : undefined;

  return (
    <SetupFrame
      header="Leftovers"
      step="Leftovers"
      title={`${money(leftoverTotal(lines))} rolled over`}
      intro="Everyday money you didn't spend last month. Choose where it goes."
      footer={
        <>
          <PanelError message={write.error} />
          <Button fullWidth label="Continue" loading={write.busy} onPress={() => void apply()} />
          <Button fullWidth label="Skip" variant="tertiary" onPress={next} />
        </>
      }
    >
      <View style={styles.options}>
        <ListGroup dividerInset={0}>
          <ChoiceRow
            label="Keep in the same envelopes"
            note="They carry over as they are. Nothing changes."
            ticked={option === "keep"}
            onPress={() => pick("keep")}
          />
          <ChoiceRow
            label="Move to a Saving for envelope"
            note={
              savings.length === 0
                ? "Add a Saving for envelope first."
                : (cannotMove ?? `Moves ${money(movableMinor)}.`)
            }
            ticked={option === "saving"}
            disabled={savings.length === 0 || movableMinor === 0}
            onPress={() => pick("saving")}
          />
          <ChoiceRow
            label="Add to next month's money to plan"
            note={cannotMove ?? `Moves ${money(movableMinor)} to money to plan.`}
            ticked={option === "plan"}
            disabled={movableMinor === 0}
            onPress={() => pick("plan")}
          />
        </ListGroup>
        {option === "saving" ? (
          <ChipRow label="Move it to">
            {savings.map((line) => (
              <Chip
                key={line.envelope.id}
                label={line.envelope.name}
                selected={line.envelope.id === savingId}
                onPress={() => setSavingId(line.envelope.id)}
              />
            ))}
          </ChipRow>
        ) : null}
      </View>
    </SetupFrame>
  );
}

const styles = StyleSheet.create({
  options: { gap: space[3] },
});
