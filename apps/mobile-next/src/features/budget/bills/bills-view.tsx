import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Banner, Button, layout, Screen, SegmentedControl, space, Text } from "@/ui/trove";

import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import { useDue } from "../due/use-due";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";
import { PLAN_ADMIN_ONLY } from "../role/budget-role";
import { useBudgetRole } from "../role/use-budget-role";

import { AddBigPaymentSheet } from "./add-big-payment-sheet";
import { BillsHeader } from "./bills-header";
import { dueByEnvelope } from "./bills-model";
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
}

/** B1: this month's bills and the big payments coming up, with Add a big payment. */
export function BillsView({ view, initialTab }: BillsViewProps) {
  const [tab, setTab] = useState<BillsTab>(initialTab);
  const lines = envelopeLines(view);
  // The same Due list Budget home reads; its `through` reaches past this period's end.
  const due = useDue(view);
  const dueMinorByEnvelopeId =
    due.loaded && !due.isError
      ? dueByEnvelope(due.items, view.envelopes, view.current.period.end)
      : undefined;
  const coverMove = useCoverMoveRequest();
  const add = useSheetRequest<true>();
  const markPaid = useSheetRequest<string>();
  const { canEditPlan, canAddSpending } = useBudgetRole();

  return (
    <Screen style={styles.screen}>
      <BillsHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
        {tab === "month" && due.isError ? (
          <View accessibilityRole="alert">
            <Banner
              actionLabel="Retry"
              message="Short shows only for overspent bills until they load."
              onAction={() => void due.retry()}
              title="Couldn't load bills due"
              tone="negative"
            />
          </View>
        ) : null}
        {tab === "month" ? (
          <ThisMonthList
            lines={lines}
            dueMinorByEnvelopeId={dueMinorByEnvelopeId}
            onCover={
              canAddSpending
                ? (targetId, shortMinor) =>
                    coverMove.show({ kind: "cover", targetId, amountMinor: shortMinor })
                : undefined
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
