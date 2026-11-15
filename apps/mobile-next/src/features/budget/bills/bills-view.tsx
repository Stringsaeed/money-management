import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KindSwitch, layout, Screen } from "@/ui/trove";

import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import type { ActiveBudgetView } from "../home/home-model";
import { useBudgetRole } from "../role/use-budget-role";

import { AddBigPaymentSheet } from "./add-big-payment-sheet";
import { BillsHeader } from "./bills-header";
import { BillsList } from "./bills-list";
import { BillsNotice } from "./bills-notice";
import { BillsSummary } from "./bills-summary";
import { BILLS_TABS, BILLS_TOP_GAP, type BillsTab } from "./bills-tab";
import { MarkPaidSheet } from "./mark-paid-sheet";
import { useBills } from "./use-bills";
import { useSheetRequest } from "./use-sheet-request";

/** Board bottom padding (40) less the 34pt home indicator inset. */
const BOTTOM_GAP = 6;

interface BillsViewProps {
  readonly view: ActiveBudgetView;
  readonly initialTab: BillsTab;
}

/** B1: this month's bills and the big payments coming up, with Add a big payment. */
export function BillsView({ view, initialTab }: BillsViewProps) {
  const [tab, setTab] = useState<BillsTab>(initialTab);
  const insets = useSafeAreaInsets();
  const bills = useBills(view);
  const coverMove = useCoverMoveRequest();
  const add = useSheetRequest<true>();
  const markPaid = useSheetRequest<string>();
  const { canEditPlan, canAddSpending } = useBudgetRole();
  const cover = canAddSpending
    ? (targetId: string, shortMinor: number) =>
        coverMove.show({ kind: "cover", targetId, amountMinor: shortMinor })
    : undefined;
  const summary = tab === "month" ? bills.monthSummary : bills.yearSummary;
  const rowCount = tab === "month" ? bills.bills.length : bills.savings.length;

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + BOTTOM_GAP }]}
        showsVerticalScrollIndicator={false}
      >
        <BillsHeader />
        <KindSwitch accessibilityLabel="Show" options={BILLS_TABS} value={tab} onChange={setTab} />
        {rowCount > 0 ? <BillsSummary lines={summary.lines} total={summary.total} /> : null}
        <BillsNotice tab={tab} bills={bills} canEditPlan={canEditPlan} onCover={cover} />
        <BillsList
          tab={tab}
          bills={bills}
          onAdd={canEditPlan ? () => add.show(true) : undefined}
          onCover={cover}
          onMarkPaid={canAddSpending ? markPaid.show : undefined}
        />
      </ScrollView>
      <AddBigPaymentSheet
        open={add.open}
        session={add.session}
        view={view}
        onDismiss={add.close}
        onAdded={() => setTab("saving")}
      />
      <MarkPaidSheet
        open={markPaid.open}
        session={markPaid.session}
        envelopeId={markPaid.value}
        view={view}
        onDismiss={markPaid.close}
      />
      <CoverMoveSheet controller={coverMove} view={view} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingHorizontal: layout.screenGutter, paddingTop: BILLS_TOP_GAP },
});
