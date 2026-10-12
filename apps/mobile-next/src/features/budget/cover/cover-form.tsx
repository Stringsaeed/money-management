import { StyleSheet, View } from "react-native";

import { useCategoriesQuery } from "@/data/ledger-queries";
import { Text } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import { envelopeEmojiOrTag } from "../envelope-emoji";
import { PanelError } from "../envelope/panel-error";
import type { ActiveBudgetView } from "../home/home-model";
import { SheetHeading } from "../sheet-heading";

import { AfterReceipt } from "./after-receipt";
import { CoverConfirm } from "./cover-confirm";
import { coverIntro, coverRestNote, noSourcesLine } from "./cover-copy";
import {
  coverAfterLines,
  coverSourceGroups,
  coverStamp,
  coverTitle,
  placeEmojis,
} from "./cover-display";
import type { CoverRequest } from "./cover-move-model";
import { CoverSourceGroup } from "./cover-source-group";
import { NothingToCover } from "./nothing-to-cover";
import { useCoverForm } from "./use-cover-form";

interface CoverFormProps {
  readonly view: ActiveBudgetView;
  readonly request: CoverRequest;
  readonly onCovered?: (targetId: string) => void;
  readonly onDone: () => void;
}

/** O2, B1 and C1 Cover from…: pick the sources, see what they leave, then move it. */
export function CoverForm({ view, request, onCovered, onDone }: CoverFormProps) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const categories = useCategoriesQuery();
  const form = useCoverForm({ view, request, onCovered, onDone });
  const { mode, target, plan, ranked, amountMinor } = form;

  if (!target || amountMinor === 0)
    return <NothingToCover name={target?.envelope.name} onDone={onDone} />;

  const categoriesById = new Map(categories.data.map((category) => [category.id, category]));
  const { envelope, totals } = target;
  const stamp = coverStamp(
    mode,
    envelope.name,
    envelopeEmojiOrTag(envelope, categoriesById),
    amountMinor,
    currency,
  );
  const restNote = coverRestNote(mode, plan, money, ranked.length > 0);
  const emojis = placeEmojis(form.lines, categoriesById);

  return (
    <View style={styles.column}>
      <SheetHeading
        stamp={stamp.text}
        stampTone={stamp.tone}
        title={coverTitle(mode)}
        onClose={onDone}
      />
      {mode === "past" ? (
        <Text tone="secondary" variant="bodySm">
          {coverIntro(mode, { name: envelope.name, amountMinor, money })}
        </Text>
      ) : null}

      {ranked.length === 0 ? (
        <Text tone="secondary" variant="bodySm">
          {noSourcesLine(mode)}
        </Text>
      ) : (
        <View accessibilityLabel="Source" accessibilityRole="radiogroup" style={styles.sources}>
          {coverSourceGroups(ranked).map((group) => (
            <CoverSourceGroup
              key={group.key}
              amountMinor={amountMinor}
              currency={currency}
              emojis={emojis}
              group={group}
              plan={plan}
              selected={form.selected}
              onToggle={form.toggle}
            />
          ))}
        </View>
      )}

      {plan.coveredMinor > 0 ? (
        <AfterReceipt
          lines={coverAfterLines(
            mode,
            plan,
            { name: envelope.name, kind: envelope.group, leftMinor: totals.leftMinor },
            {
              unassignedMinor: view.current.unassignedMinor,
              safeToSpendMinor: view.current.safeToSpendMinor,
              currency,
            },
          )}
        />
      ) : null}
      {restNote ? (
        <Text accessibilityLiveRegion="polite" tone="secondary" variant="bodySm">
          {restNote}
        </Text>
      ) : null}

      <PanelError message={form.error} />
      <CoverConfirm
        busy={form.busy}
        coveredMinor={plan.coveredMinor}
        currency={currency}
        hasSources={ranked.length > 0}
        onDone={onDone}
        onMove={form.confirmAndMove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 14 },
  sources: { gap: 6 },
});
