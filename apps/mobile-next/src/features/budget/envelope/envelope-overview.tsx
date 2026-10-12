import { StyleSheet, View } from "react-native";

import type { V2Transaction } from "@trove/api/v2/contracts";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import {
  envelopeHero,
  envelopeReceiptLines,
  periodPace,
  spendingListTitle,
  WHY_LIST_TITLE,
} from "./envelope-display";
import { EnvelopeHero } from "./envelope-hero";
import { EnvelopeReceipt } from "./envelope-receipt";
import { OverBanner } from "./over-banner";
import { SectionTitle } from "./section-title";
import { SpendingRows } from "./spending-rows";
import type { EnvelopeSpending } from "./use-envelope-spending";

interface EnvelopeOverviewProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly currency: string;
  readonly spending: EnvelopeSpending;
  readonly onOpenTransaction: (transaction: V2Transaction) => void;
}

/** Everything above the spending list: the over banner, hero, receipt and the "why" spends. */
export function EnvelopeOverview({
  view,
  line,
  currency,
  spending,
  onOpenTransaction,
}: EnvelopeOverviewProps) {
  const { envelope, totals } = line;
  const { daysLeft, period } = view.current;
  const hero = envelopeHero(totals, daysLeft, currency);
  const { list } = spending;
  return (
    <View style={styles.column}>
      {hero.over ? (
        <OverBanner
          currency={currency}
          group={envelope.group}
          onCard={spending.onCard}
          overMinor={-totals.leftMinor}
        />
      ) : null}
      <EnvelopeHero currency={currency} hero={hero} pace={periodPace(period, daysLeft)} />
      <EnvelopeReceipt
        left={hero.figure}
        lines={envelopeReceiptLines(totals, currency)}
        over={hero.over}
      />
      {hero.over && spending.largest.length > 0 ? (
        <View>
          <SectionTitle title={WHY_LIST_TITLE} />
          <SpendingRows
            spending={spending}
            transactions={spending.largest}
            onOpenTransaction={onOpenTransaction}
          />
        </View>
      ) : null}
      <SectionTitle
        title={spendingListTitle(
          list.data.length,
          spending.hasCategories && !list.isLoading && !list.isError && !list.hasNextPage,
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // The board's 16pt column gap; the list title sits 2pt over the first row.
  column: { gap: 16 },
});
