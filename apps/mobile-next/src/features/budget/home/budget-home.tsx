import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button, ListGroup, space, Text } from "@/ui/trove";

import { pickAttention } from "./attention";
import { AttentionLine } from "./attention-line";
import { EverydayRow } from "./everyday-row";
import { DueTodayRow } from "../due/due-today-row";
import { useDue } from "../due/use-due";
import { PaydayActions } from "../payday/payday-actions";
import { usePayday } from "../payday/use-payday";
import { BudgetReminders } from "../reminders/budget-reminders";
import { GroupSummaryRow } from "./group-summary-row";
import { envelopeLines, groupSummary, type ActiveBudgetView } from "./home-model";
import { SafeToSpendHero } from "./safe-to-spend-hero";
import { OverNotice } from "./over-notice";
import { useHomeAnalytics } from "./use-home-analytics";
import { HouseholdHomeExtras } from "../household/household-home-extras";
import { useBudgetRole } from "../role/use-budget-role";
import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import { QuickAddSheet } from "../quick-add/quick-add-sheet";

interface BudgetHomeProps {
  readonly view: ActiveBudgetView;
  /** Scrolls the enclosing list so `y` is at the top. */
  readonly scrollToY: (y: number) => void;
}

interface QuickAddTarget {
  readonly open: boolean;
  readonly envelopeId: string | null;
  readonly session: number;
}

/** Quick add's sheet needs this long to finish closing before Cover can present over it. */
const SHEET_HANDOFF_MS = 400;

/** M1: Safe to spend, the pace to payday, what needs attention, and the envelopes. */
export function BudgetHome({ view, scrollToY }: BudgetHomeProps) {
  const { current } = view;
  const lines = envelopeLines(view);
  const everyday = lines.filter((line) => line.envelope.group === "everyday");
  const due = useDue(view);
  const payday = usePayday(view);
  const attention = pickAttention({
    envelopes: lines.map(({ envelope, totals }) => ({
      name: envelope.name,
      leftMinor: totals.leftMinor,
    })),
    unassignedMinor: current.unassignedMinor,
    dueTodayCount: due.dueNow.count,
    paydayPending: payday.status.pending,
    paydayLate: payday.status.pending && payday.status.late,
  });
  useHomeAnalytics(attention);
  const over = current.safeToSpendMinor < 0;
  const everydayY = useRef(0);
  const [quickAdd, setQuickAdd] = useState<QuickAddTarget>({
    open: false,
    envelopeId: null,
    session: 0,
  });
  const openQuickAdd = (envelopeId: string | null) =>
    setQuickAdd((current) => ({ open: true, envelopeId, session: current.session + 1 }));
  const coverMove = useCoverMoveRequest();
  const { canAddSpending } = useBudgetRole();
  // The Everyday envelope that is furthest over; with none over, Cover points at the list instead.
  // (`sort` on the fresh filtered array: Hermes has no `toSorted`.)
  const mostOver = everyday
    .filter((line) => line.totals.leftMinor < 0)
    .sort((a, b) => a.totals.leftMinor - b.totals.leftMinor)[0];

  return (
    <View style={styles.container}>
      <SafeToSpendHero current={current} />

      {over ? (
        <OverNotice
          overMinor={-current.safeToSpendMinor}
          onCover={
            canAddSpending
              ? () =>
                  mostOver
                    ? coverMove.show({ kind: "cover", targetId: mostOver.envelope.id })
                    : scrollToY(everydayY.current)
              : undefined
          }
          onAdjust={() => scrollToY(everydayY.current)}
        />
      ) : null}

      <AttentionLine attention={attention} />
      {attention.top?.kind === "payday" ? (
        <PaydayActions today={payday.today} reminders={due.reminders} />
      ) : null}
      <DueTodayRow due={due} />
      <BudgetReminders view={view} due={due} />

      <View
        onLayout={(event) => {
          everydayY.current = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.section}>
          <Text variant="titleMd">Everyday</Text>
          {everyday.length === 0 ? (
            <Text tone="secondary" variant="bodySm">
              No everyday envelopes yet.
            </Text>
          ) : (
            everyday.map((line) => (
              <EverydayRow
                key={line.envelope.id}
                line={line}
                onPress={() =>
                  router.push({
                    pathname: "/budget/envelope/[id]",
                    params: { id: line.envelope.id },
                  })
                }
                onLongPress={canAddSpending ? () => openQuickAdd(line.envelope.id) : undefined}
              />
            ))
          )}
        </View>
      </View>

      <ListGroup dividerInset={0}>
        <GroupSummaryRow
          title="Bills"
          noun={{ one: "bill", many: "bills" }}
          leftLabel="left"
          summary={groupSummary(lines, "bills")}
          onPress={() => router.push({ pathname: "/budget/bills", params: { tab: "month" } })}
        />
        <GroupSummaryRow
          title="Saving for"
          noun={{ one: "goal", many: "goals" }}
          leftLabel="set aside"
          summary={groupSummary(lines, "saving")}
          onPress={() => router.push({ pathname: "/budget/bills", params: { tab: "saving" } })}
        />
      </ListGroup>

      {canAddSpending ? (
        <Button fullWidth icon="add" label="Add spending" onPress={() => openQuickAdd(null)} />
      ) : null}

      <HouseholdHomeExtras />

      <QuickAddSheet
        open={quickAdd.open}
        session={quickAdd.session}
        view={view}
        preselectedEnvelopeId={quickAdd.envelopeId}
        onDismiss={() => setQuickAdd((current) => ({ ...current, open: false }))}
        onCover={(saved) =>
          setTimeout(
            () => coverMove.show({ kind: "cover", targetId: saved.envelopeId }),
            SHEET_HANDOFF_MS,
          )
        }
      />
      <CoverMoveSheet controller={coverMove} view={view} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[5] },
  section: { gap: space[3] },
});
