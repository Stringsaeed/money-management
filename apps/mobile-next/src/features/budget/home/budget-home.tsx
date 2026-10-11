import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Amount, Button, ListGroup, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { pickAttention } from "./attention";
import { AttentionLine } from "./attention-line";
import { EverydayRow } from "./everyday-row";
import { DueTodayRow } from "../due/due-today-row";
import { useDue } from "../due/use-due";
import { BudgetReminders } from "../reminders/budget-reminders";
import { GroupSummaryRow } from "./group-summary-row";
import { envelopeLines, groupSummary, perDayLine, type ActiveBudgetView } from "./home-model";
import { OverNotice } from "./over-notice";
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

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** M1: Safe to spend, the pace to payday, what needs attention, and the envelopes. */
export function BudgetHome({ view, scrollToY }: BudgetHomeProps) {
  const { current } = view;
  const lines = envelopeLines(view);
  const everyday = lines.filter((line) => line.envelope.group === "everyday");
  const due = useDue(view);
  const attention = pickAttention({
    envelopes: lines.map(({ envelope, totals }) => ({
      name: envelope.name,
      leftMinor: totals.leftMinor,
    })),
    unassignedMinor: current.unassignedMinor,
    dueTodayCount: due.dueNow.count,
  });
  const over = current.safeToSpendMinor <= 0;
  const everydayY = useRef(0);
  const [quickAdd, setQuickAdd] = useState<QuickAddTarget>({
    open: false,
    envelopeId: null,
    session: 0,
  });
  const openQuickAdd = (envelopeId: string | null) =>
    setQuickAdd((current) => ({ open: true, envelopeId, session: current.session + 1 }));
  const coverMove = useCoverMoveRequest();
  // The Everyday envelope that is furthest over; with none over, Cover points at the list instead.
  const mostOver = everyday
    .filter((line) => line.totals.leftMinor < 0)
    .toSorted((a, b) => a.totals.leftMinor - b.totals.leftMinor)[0];

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityLabel={`Safe to spend ${money(current.safeToSpendMinor)}. ${perDayLine(current, money)}`}
        style={styles.hero}
      >
        <Text tone="secondary" variant="labelSm">
          Safe to spend
        </Text>
        <Amount
          currency={BUDGET_CURRENCY}
          minor={current.safeToSpendMinor}
          size="hero"
          tone={current.safeToSpendMinor < 0 ? "negative" : "primary"}
        />
        <Text tone="secondary" variant="bodySm">
          {perDayLine(current, money)}
        </Text>
      </View>

      {over ? (
        <OverNotice
          overMinor={-current.safeToSpendMinor}
          onCover={() =>
            mostOver
              ? coverMove.show({ kind: "cover", targetId: mostOver.envelope.id })
              : scrollToY(everydayY.current)
          }
          onAdjust={() => scrollToY(everydayY.current)}
        />
      ) : null}

      <AttentionLine attention={attention} />
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
                onLongPress={() => openQuickAdd(line.envelope.id)}
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

      <Button fullWidth icon="add" label="Add spending" onPress={() => openQuickAdd(null)} />

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
  hero: { gap: space[1] },
  section: { gap: space[3] },
});
