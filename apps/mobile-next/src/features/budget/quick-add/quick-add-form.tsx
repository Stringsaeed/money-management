import { StyleSheet, View } from "react-native";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";
import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Button } from "@/ui/button";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";

import { AmountDisplay } from "../../ledger/transactions/amount-display";
import { NumPad } from "../../ledger/transactions/num-pad";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { CategoryChips } from "./category-chips";
import { EnvelopeChips } from "./envelope-chips";
import { PaidWithChips } from "./paid-with-chips";
import type { QuickAddMemory } from "./quick-add-memory";
import { QuickAddDate } from "./quick-add-date";
import { useQuickAddForm } from "./use-quick-add-form";
import type { SavedSpend } from "./use-save-spend";

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
      <Text variant="title">Add spending</Text>
      <AmountDisplay
        amount={form.amount}
        currency={BUDGET_CURRENCY}
        fractionDigits={form.fractionDigits}
      />
      <Text
        variant="label"
        accessibilityLiveRegion="polite"
        style={[styles.impact, form.impact?.over && styles.over]}
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

      <NumPad
        allowDecimal={form.fractionDigits > 0}
        onKey={form.pressKey}
        onClear={form.clearAmount}
      />

      {form.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {form.error}
        </Text>
      ) : null}
      <Button title="Save" loading={form.busy} onPress={() => void form.submit(false)} />
      {form.impact?.over ? (
        <Button
          title="Save & cover it"
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
  container: { gap: spacing[3] },
  impact: { textAlign: "center" },
  over: { color: colors.terracotta },
  error: {
    color: colors.destructive,
    fontFamily: typography.fontBodyMedium,
    textAlign: "center",
  },
});
