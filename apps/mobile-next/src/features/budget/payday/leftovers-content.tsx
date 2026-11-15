import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useCategoriesQuery, useLedgerMutations } from "@/data/ledger-queries";
import { ActionBar, RadioCard, showToast } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import { PanelError } from "../envelope/panel-error";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import { categoriesById, envelopeEmoji } from "../envelope-emoji";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { ChoiceSheet } from "./choice-sheet";
import {
  KEEP_SUB,
  KEEP_TITLE,
  leftoverShareLine,
  PLAN_TITLE,
  planItSub,
  SAVE_TITLE,
  saveItSub,
} from "./leftovers-copy";
import { LeftoversHero } from "./leftovers-hero";
import {
  leftoverBreakdown,
  leftoverChoice,
  leftoverLines,
  leftoversInput,
  leftoverTotal,
  type LeftoverOption,
} from "./leftovers-model";
import { nextPaydayStep, paydayFlowFacts, paydayStepPosition } from "./payday-flow";
import { stepLeading } from "./payday-nav";
import { PaydayStepFrame } from "./payday-step-frame";
import { SavingPickerChip } from "./saving-picker-chip";

/** C2: what happens to Everyday money that rolled over. Keeping it (the default) writes nothing. */
export function LeftoversContent({ view }: { readonly view: ActiveBudgetView }) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const categories = useCategoriesQuery();
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const lines = envelopeLines(view);
  const movable = leftoverLines(lines);
  const movableMinor = movable.reduce((total, line) => total + line.amountMinor, 0);
  const totalMinor = leftoverTotal(lines);
  const savings = lines.filter((line) => line.envelope.group === "saving");
  const categoryLookup = categoriesById(categories.data);
  const emojiOf = (line: (typeof lines)[number]) => envelopeEmoji(line.envelope, categoryLookup);
  const facts = paydayFlowFacts(view);
  const position = paydayStepPosition("leftovers", facts);

  const [option, setOption] = useState<LeftoverOption>("keep");
  const [savingId, setSavingId] = useState<string | null>(savings[0]?.envelope.id ?? null);
  const [picking, setPicking] = useState(false);
  const effective = leftoverChoice(option, savingId);
  const saving = savings.find((line) => line.envelope.id === savingId) ?? null;

  const apply = async () => {
    const plan = nextPaydayStep("leftovers", facts);
    const input = leftoversInput(movable, effective);
    // Nothing written: pushed, so Back returns here. After a move, replaced so it can't run twice.
    if (!input) return router.push(plan);
    const ok = await write.run(() => createAssignments(input));
    if (!ok) return undefined;
    showToast({
      message:
        effective.kind === "plan"
          ? `${money(movableMinor)} is now money to plan`
          : `${money(movableMinor)} moved to savings`,
    });
    return router.replace(plan);
  };

  const pick = (choice: LeftoverOption) => {
    write.clearError();
    setOption(choice);
  };
  const moveFacts = { movableMinor, totalMinor, currency };
  const canSave = savings.length > 0 && movableMinor > 0;

  return (
    <PaydayStepFrame
      {...stepLeading(position.first)}
      footer={
        <ActionBar primary={{ label: "Next", loading: write.busy, onPress: () => void apply() }} />
      }
      of={position.of}
      step={position.step}
      tag="LEFTOVERS"
    >
      <LeftoversHero
        currency={currency}
        shares={leftoverShareLine(
          leftoverBreakdown(lines).map((share) => {
            const line = lines.find((item) => item.envelope.id === share.envelopeId);
            return {
              label: (line && emojiOf(line)) ?? share.name,
              rolloverMinor: share.rolloverMinor,
            };
          }),
          currency,
        )}
        totalMinor={totalMinor}
      />
      <View accessibilityLabel="Leftovers" accessibilityRole="radiogroup" style={styles.options}>
        <RadioCard
          emoji="📦"
          onPress={() => pick("keep")}
          selected={option === "keep"}
          size="lg"
          sub={KEEP_SUB}
          title={KEEP_TITLE}
        />
        <RadioCard
          disabled={!canSave}
          emoji="🛟"
          onPress={() => pick("saving")}
          selected={option === "saving"}
          size="lg"
          sub={saveItSub(moveFacts, savings.length > 0)}
          title={SAVE_TITLE}
        >
          {canSave && saving ? (
            <SavingPickerChip
              canChange={savings.length > 1}
              emoji={emojiOf(saving)}
              name={saving.envelope.name}
              onPress={() => {
                pick("saving");
                if (savings.length > 1) setPicking(true);
              }}
            />
          ) : null}
        </RadioCard>
        <RadioCard
          disabled={movableMinor === 0}
          emoji="🫙"
          onPress={() => pick("plan")}
          selected={option === "plan"}
          size="lg"
          sub={planItSub(movableMinor)}
          title={PLAN_TITLE}
        />
      </View>
      <PanelError message={write.error} />
      <ChoiceSheet
        choices={savings.map((line) => ({
          id: line.envelope.id,
          title: line.envelope.name,
          emoji: emojiOf(line) ?? undefined,
        }))}
        onDismiss={() => setPicking(false)}
        onSelect={setSavingId}
        open={picking}
        selectedId={savingId}
        title="Save it in"
      />
    </PaydayStepFrame>
  );
}

const styles = StyleSheet.create({
  options: { gap: 10 },
});
