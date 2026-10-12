import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { SafeToSpend, SafeToSpendError } from "@/ui/trove";

import { CurrencySwitch } from "../currency/currency-switch";
import { StartBudgetPrompt } from "../currency/start-budget-prompt";
import { CoverMoveSheet } from "../cover/cover-move-sheet";
import { useCoverMoveRequest } from "../cover/use-cover-move-request";
import { HouseholdHomeExtras } from "../household/household-home-extras";
import { QuickAddSheet } from "../quick-add/quick-add-sheet";
import { useQuickAddRequests } from "../quick-add/use-quick-add-requests";
import { BudgetReminders } from "../reminders/budget-reminders";
import { navigateAttention, openEnvelope } from "./attention-navigation";
import { BudgetHeader } from "./budget-header";
import { budgetStamp } from "./budget-stamp";
import { compactMoney } from "./compact-money";
import { EverydaySection } from "./everyday-section";
import { HomeAttentionSlot } from "./home-attention-slot";
import type { ActiveBudgetView } from "./home-model";
import { floorWholeMinor, periodPace, runwayLabel } from "./runway";
import { SummaryTickets } from "./summary-tickets";
import { useBudgetHome } from "./use-budget-home";

interface BudgetHomeProps {
  readonly view: ActiveBudgetView;
  /** Scrolls the enclosing list so `y` (in this column) is at the top. */
  readonly scrollToY: (y: number) => void;
  /**
   * A refresh failed: `view` is out of date, so its numbers are hidden behind dashes and the
   * hero offers Retry. Names stay, so the page keeps its shape.
   */
  readonly stale?: boolean;
  readonly onRetry: () => void;
}

interface QuickAddTarget {
  readonly open: boolean;
  readonly envelopeId: string | null;
  readonly session: number;
}

/** Quick add's sheet needs this long to finish closing before Cover can present over it. */
const SHEET_HANDOFF_MS = 400;

const STALE_TICKET = { value: "—", sub: " " } as const;

/** M1 and H3: Safe to spend and the runway, the one thing that needs you, Everyday, tickets. */
export function BudgetHome({ view, scrollToY, stale = false, onRetry }: BudgetHomeProps) {
  const { current } = view;
  const home = useBudgetHome(view);
  const { currency, access } = home;
  const everydayY = useRef(0);
  const activityY = useRef(0);
  const coverMove = useCoverMoveRequest();
  const [quickAdd, setQuickAdd] = useState<QuickAddTarget>({
    open: false,
    envelopeId: null,
    session: 0,
  });
  const openQuickAdd = (envelopeId: string | null) =>
    setQuickAdd((state) => ({ open: true, envelopeId, session: state.session + 1 }));
  const canQuickAdd = access.canAddSpending && !stale;
  useQuickAddRequests(canQuickAdd, () => openQuickAdd(null));

  return (
    <View style={styles.column}>
      <BudgetHeader
        bell={{ count: stale ? 0 : home.dueCount, onPress: () => router.push("/budget/due") }}
        stamp={budgetStamp(home.today, current.period.start)}
      />
      <CurrencySwitch />

      {stale ? (
        <SafeToSpendError
          message="Everything you logged is saved. We won't show a number until it's right."
          onRetry={onRetry}
          title="Couldn't calculate right now"
        />
      ) : (
        <SafeToSpend
          currency={currency}
          daysEmoji="💰"
          daysLeft={current.daysLeft}
          perDayMinor={floorWholeMinor(Math.max(current.perDayMinor, 0), currency)}
          runwayLabel={runwayLabel(home.ticks, current.daysLeft)}
          safeMinor={current.safeToSpendMinor}
          ticks={home.ticks}
        />
      )}

      {stale ? null : (
        <HomeAttentionSlot
          access={access}
          attention={home.attention}
          context={{ money: (minor) => compactMoney(minor, currency), now: new Date() }}
          onTarget={(target) =>
            navigateAttention(target, {
              retryDue: () => void home.due.retry(),
              cover: (envelopeId) => coverMove.show({ kind: "cover", targetId: envelopeId }),
              scrollToEveryday: () => scrollToY(everydayY.current),
              scrollToActivity: () => scrollToY(activityY.current),
            })
          }
        />
      )}

      <EverydaySection
        currency={currency}
        daysLeft={current.daysLeft}
        emojiFor={home.emojiFor}
        lines={home.everyday}
        onLayout={(event) => {
          everydayY.current = event.nativeEvent.layout.y;
        }}
        onOpen={openEnvelope}
        onQuickAdd={canQuickAdd ? openQuickAdd : undefined}
        pace={periodPace(current)}
        stale={stale}
      />

      <SummaryTickets
        bills={stale ? STALE_TICKET : home.bills}
        saving={stale ? STALE_TICKET : home.saving}
        savingEmoji={home.savingEmoji}
      />

      {stale ? null : (
        <>
          <HouseholdHomeExtras
            onActivityLayout={(event) => {
              activityY.current = event.nativeEvent.layout.y;
            }}
          />
          <BudgetReminders />
          <StartBudgetPrompt />
        </>
      )}

      <QuickAddSheet
        open={quickAdd.open}
        session={quickAdd.session}
        view={view}
        preselectedEnvelopeId={quickAdd.envelopeId}
        onDismiss={() => setQuickAdd((state) => ({ ...state, open: false }))}
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
  column: { gap: 18 },
});
