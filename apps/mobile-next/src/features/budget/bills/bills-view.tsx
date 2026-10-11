import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { Button, layout, Screen, SegmentedControl, space, Text } from "@/ui/trove";

import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";
import { PLAN_ADMIN_ONLY } from "../role/budget-role";
import { useBudgetRole } from "../role/use-budget-role";

import { AddBigPaymentSheet } from "./add-big-payment-sheet";
import { BillsHeader } from "./bills-header";
import { MarkPaidSheet } from "./mark-paid-sheet";
import { NextYearList } from "./next-year-list";
import { ThisMonthList } from "./this-month-list";
import { useSheetRequest } from "./use-sheet-request";

export type BillsTab = "month" | "saving";

const TABS = [
  { value: "month", label: "This month" },
  { value: "saving", label: "Next 12 months" },
] as const satisfies readonly { value: BillsTab; label: string }[];

interface BillsViewProps {
  readonly view: ActiveBudgetView;
  readonly initialTab: BillsTab;
  /** Recurring due data (#372) per Bills envelope id; see `ThisMonthList`. */
  readonly dueMinorByEnvelopeId?: ReadonlyMap<string, number>;
}

/** B1: this month's bills and the big payments coming up, with Add a big payment. */
export function BillsView({ view, initialTab, dueMinorByEnvelopeId }: BillsViewProps) {
  const [tab, setTab] = useState<BillsTab>(initialTab);
  const lines = envelopeLines(view);
  const coverMove = useCoverMoveRequest();
  const add = useSheetRequest<true>();
  const markPaid = useSheetRequest<string>();
  const { canEditPlan, canAddSpending } = useBudgetRole();

  return (
    <Screen style={styles.screen}>
      <BillsHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
        {tab === "month" ? (
          <ThisMonthList
            lines={lines}
            dueMinorByEnvelopeId={dueMinorByEnvelopeId}
            onCover={
              canAddSpending ? (targetId) => coverMove.show({ kind: "cover", targetId }) : undefined
            }
          />
        ) : (
          <NextYearList lines={lines} onMarkPaid={canAddSpending ? markPaid.show : undefined} />
        )}
        {canEditPlan ? (
          <Button fullWidth icon="add" label="Add a big payment" onPress={() => add.show(true)} />
        ) : (
          <Text tone="secondary" variant="bodySm">
            {PLAN_ADMIN_ONLY}
          </Text>
        )}
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
  screen: { paddingHorizontal: layout.screenGutter },
  content: { gap: space[4], paddingBottom: space[10], paddingTop: space[3] },
});
