import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { V2Account, V2Category } from "@trove/api/v2/contracts";
import { Keypad, KindSwitch, space, Text } from "@/ui/trove";

import { useBudgetCurrency } from "../currency/use-budget-currency";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { EnvelopeChips } from "./envelope-chips";
import { QuickAddActions } from "./quick-add-actions";
import { QuickAddAmount } from "./quick-add-amount";
import { PAD_HEIGHT, QuickAddDetails } from "./quick-add-details";
import { QuickAddHeader } from "./quick-add-header";
import { QuickAddImpact } from "./quick-add-impact";
import { QUICK_ADD_KINDS } from "./quick-add-kinds";
import type { QuickAddMemory } from "./quick-add-memory";
import { QuickAddMetaChips } from "./quick-add-meta-chips";
import { sheetBodyFrame } from "./sheet-body-frame";
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
  /** Whose budget, e.g. "👤 PERSONAL BUDGET". */
  readonly stamp: string;
  readonly onSaved: (saved: SavedSpend) => void;
  readonly onAddCard: () => void;
  readonly onClose: () => void;
  /** The "Got paid" tab: Quick add hands over to the Got paid flow. */
  readonly onGotPaid: () => void;
}

/** Amount first (keypad is already up), then envelope, then Save. Everything else is optional. */
export function QuickAddForm({
  view,
  accounts,
  categories,
  memory,
  remember,
  preselectedEnvelopeId,
  stamp,
  onSaved,
  onAddCard,
  onClose,
  onGotPaid,
}: QuickAddFormProps) {
  const currency = useBudgetCurrency();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, sheetBodyFrame(window.height, insets)]}>
      <QuickAddHeader onClose={onClose} stamp={stamp} />
      <KindSwitch
        accessibilityLabel="Kind"
        onChange={(kind) => {
          if (kind === "got_paid") onGotPaid();
        }}
        options={QUICK_ADD_KINDS}
        value="spent"
      />

      <View style={styles.hero}>
        <QuickAddAmount
          amountMinor={form.amountMinor}
          currency={currency}
          onPress={form.panel ? form.closePanel : undefined}
          value={form.amount}
        />
        <QuickAddImpact impact={form.impact} placementNote={form.placementNote} />
      </View>

      <EnvelopeChips
        chips={form.envelopeChips}
        onQueryChange={form.setQuery}
        onSelect={form.selectEnvelope}
        query={form.query}
        selectedId={form.selected?.envelope.id ?? null}
        totalCount={form.envelopeCount}
      />
      <QuickAddMetaChips
        account={form.account}
        category={form.category}
        categoryCount={form.envelopeCategories.length}
        date={form.date}
        note={form.note}
        onToggle={form.togglePanel}
        panel={form.panel}
      />

      {form.panel ? (
        <QuickAddDetails
          accountId={form.accountId}
          cards={form.cards}
          categories={form.envelopeCategories}
          categoryId={form.categoryId}
          date={form.date}
          funding={form.funding}
          note={form.note}
          onAccount={form.selectAccount}
          onAddCard={onAddCard}
          onCategory={form.selectCategory}
          onDate={form.setDate}
          onDone={form.closePanel}
          onNote={form.setNote}
          panel={form.panel}
        />
      ) : (
        <Keypad
          fill
          maxFractionDigits={form.fractionDigits}
          maxIntegerDigits={MAX_INTEGER_DIGITS}
          onChange={form.changeAmount}
          onClear={form.clearAmount}
          style={styles.pad}
          value={form.amount}
        />
      )}

      {form.error ? (
        <Text accessibilityRole="alert" style={styles.centered} tone="negative" variant="labelMd">
          {form.error}
        </Text>
      ) : null}
      <QuickAddActions
        busy={form.busy}
        onSave={() => void form.submit(false)}
        onSaveAndCover={() => void form.submit(true)}
        over={form.impact?.over ?? false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
  hero: { alignItems: "center", flex: 1, gap: space[2] + 2, justifyContent: "center" },
  pad: { height: PAD_HEIGHT },
  centered: { textAlign: "center" },
});
