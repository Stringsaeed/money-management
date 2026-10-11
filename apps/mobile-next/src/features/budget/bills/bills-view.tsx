import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { Chip } from "@/ui/chip";
import { spacing } from "@/ui/design-tokens";
import { Screen } from "@/ui/screen";

import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { AddBigPaymentSheet } from "./add-big-payment-sheet";
import { MarkPaidSheet } from "./mark-paid-sheet";
import { NextYearList } from "./next-year-list";
import { ThisMonthList } from "./this-month-list";
import { useSheetRequest } from "./use-sheet-request";

export type BillsTab = "month" | "saving";

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

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabs}>
          <Chip label="This month" selected={tab === "month"} onPress={() => setTab("month")} />
          <Chip
            label="Next 12 months"
            selected={tab === "saving"}
            onPress={() => setTab("saving")}
          />
        </View>
        {tab === "month" ? (
          <ThisMonthList
            lines={lines}
            dueMinorByEnvelopeId={dueMinorByEnvelopeId}
            onCover={(targetId) => coverMove.show({ kind: "cover", targetId })}
          />
        ) : (
          <NextYearList lines={lines} onMarkPaid={markPaid.show} />
        )}
        <Button title="+ Add a big payment" onPress={() => add.show(true)} />
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
  content: { gap: spacing[4], padding: spacing[5], paddingBottom: spacing[10] },
  tabs: { flexDirection: "row", gap: spacing[2] },
});
