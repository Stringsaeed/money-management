import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";
import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button, EntryAmount, Keypad, space, Text, TextField } from "@/ui/trove";

import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { CategoryChips } from "./category-chips";
import { EnvelopeChips } from "./envelope-chips";
import { PaidWithChips } from "./paid-with-chips";
import type { QuickAddMemory } from "./quick-add-memory";
import { QuickAddDate } from "./quick-add-date";
import { useQuickAddForm } from "./use-quick-add-form";
import type { SavedSpend } from "./use-save-spend";

/** Whole digits the amount accepts, as in the transaction editor. */
const MAX_INTEGER_DIGITS = 12;

interface QuickAddFormProps {
  readonly view: ActiveBudgetView;
  readonly accounts: readonly V2Account[];
  readonly categories: readonly V2Category[];
  readonly memory: QuickAddMemory;
  readonly remember: (spend: { accountId: string; envelopeId: string }) => Promise<void>;
  readonly preselectedEnvelopeId: string | null;
  readonly onSaved: (saved: SavedSpend) => void;
  readonly onAddCard: () => void;
}

/** Amount first (keypad is already up), then envelope, then Save. Everything else is optional. */
export function QuickAddForm({
  view,
  accounts,
  categories,
  memory,
  remember,
  preselectedEnvelopeId,
  onSaved,
  onAddCard,
}: QuickAddFormProps) {
  const form = useQuickAddForm({
    view,
    lines: envelopeLines(view),
    accounts,
    categories,
    memory,
    remember,
    preselectedEnvelopeId,
    onSaved,
  });

  return (
    <View style={styles.container}>
      <Text variant="titleMd">Add spending</Text>
      <EntryAmount currency={BUDGET_CURRENCY} negative value={form.amount} />
      <Text
        accessibilityLiveRegion="polite"
        style={styles.centered}
        tone={form.impact?.over ? "negative" : "secondary"}
        variant="labelSm"
      >
        {form.impact?.text ?? " "}
      </Text>

      <EnvelopeChips
        envelopes={form.envelopes}
        totalCount={form.envelopeCount}
        selectedId={form.selected?.envelope.id ?? null}
        query={form.query}
        onQueryChange={form.setQuery}
        onSelect={form.selectEnvelope}
      />
      <CategoryChips
        categories={form.envelopeCategories}
        selectedId={form.categoryId}
        onSelect={form.selectCategory}
      />
      <PaidWithChips
        funding={form.funding}
        cards={form.cards}
        selectedId={form.accountId}
        onSelect={form.selectAccount}
        onAddCard={onAddCard}
      />

      <Keypad
        maxFractionDigits={form.fractionDigits}
        maxIntegerDigits={MAX_INTEGER_DIGITS}
        onChange={form.changeAmount}
        onClear={form.clearAmount}
        value={form.amount}
      />

      {form.error ? (
        <Text accessibilityRole="alert" style={styles.centered} tone="negative" variant="labelMd">
          {form.error}
        </Text>
      ) : null}
      <Button fullWidth label="Save" loading={form.busy} onPress={() => void form.submit(false)} />
      {form.impact?.over ? (
        <Button
          fullWidth
          label="Save & cover it"
          variant="secondary"
          loading={form.busy}
          onPress={() => void form.submit(true)}
        />
      ) : null}

      <TextField
        label="Note (optional)"
        value={form.note}
        onChangeText={form.setNote}
        returnKeyType="done"
      />
      <QuickAddDate date={form.date} onChange={form.setDate} placementNote={form.placementNote} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
  centered: { textAlign: "center" },
});
