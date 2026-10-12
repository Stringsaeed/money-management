import { StyleSheet, View } from "react-native";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { compactAmount, FlowButton, SelectChip, Text } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { codeAmount } from "../envelope/envelope-figures";
import { PanelError } from "../envelope/panel-error";
import type { ActiveBudgetView } from "../home/home-model";

import { AfterReceipt } from "./after-receipt";
import { placeEmojis } from "./cover-display";
import { moveAfterLines } from "./move-display";
import { MoveAmountField } from "./move-amount-field";
import { MoveEnds } from "./move-ends";
import { SheetHeading } from "./sheet-heading";
import { useMoveForm } from "./use-move-form";

interface MoveFormProps {
  readonly view: ActiveBudgetView;
  /** Envelope to take from; `null` starts at Not planned yet. */
  readonly fromId: string | null;
  /** Envelope to move into, when the caller already knows it. */
  readonly toId?: string | null;
  readonly onDone: () => void;
}

/** O3 Move money: from and to, the amount (capped at what the source has), and what it leaves. */
export function MoveForm({ view, fromId, toId, onDone }: MoveFormProps) {
  const currency = useBudgetCurrency();
  const categories = useCategoriesQuery();
  const form = useMoveForm({ view, fromId, toId, onDone });
  const { from, to, amountMinor } = form;
  const categoriesById = new Map(categories.data.map((category) => [category.id, category]));
  const emojis = placeEmojis(form.lines, categoriesById);

  return (
    <View style={styles.column}>
      <SheetHeading stamp="BETWEEN ENVELOPES" title="Move money" onClose={onDone} />
      <MoveEnds
        currency={currency}
        emojis={emojis}
        from={from}
        picking={form.picking}
        places={form.places}
        to={to}
        onChoose={form.choose}
        onSwap={form.swap}
        onToggle={form.togglePicker}
      />
      <MoveAmountField
        currency={currency}
        label={`AMOUNT · UP TO ${compactAmount(form.capMinor, currency)}`}
        value={form.text}
        onChangeText={form.changeText}
      />
      {form.quickPicks.length > 0 ? (
        <View style={styles.picks}>
          {form.quickPicks.map((pick) => (
            <SelectChip
              key={pick.key}
              label={pick.label}
              selected={amountMinor === pick.amountMinor}
              size="md"
              variant="envelope"
              onPress={() => form.pickAmount(pick.amountMinor)}
            />
          ))}
        </View>
      ) : null}

      {form.ready && from && to && amountMinor !== null ? (
        <AfterReceipt
          lines={moveAfterLines(from, to, amountMinor, {
            safeToSpendMinor: view.current.safeToSpendMinor,
            currency,
          })}
        />
      ) : form.hint ? (
        <Text
          accessibilityLiveRegion="polite"
          style={styles.hint}
          tone="secondary"
          variant="bodySm"
        >
          {form.hint}
        </Text>
      ) : null}

      <PanelError message={form.error} />
      <FlowButton
        disabled={!form.ready}
        label={
          form.ready && amountMinor !== null ? `Move ${codeAmount(amountMinor, currency)}` : "Move"
        }
        loading={form.busy}
        size="cta"
        onPress={form.move}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 14 },
  picks: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  hint: { textAlign: "center" },
});
