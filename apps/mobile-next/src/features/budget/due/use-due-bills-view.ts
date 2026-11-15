import { Alert } from "react-native";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { useAccountsQuery, useCategoriesQuery } from "@/data/ledger-queries";
import { track } from "@/features/analytics";
import { useLedgerMutationsWithSound } from "@/features/sound";
import { showToast } from "@/ui/trove";

import { envelopeLines, type ActiveBudgetView } from "../home/home-model";
import { impactMoney } from "../quick-add/quick-add-model";
import { useBudgetRole } from "../role/use-budget-role";

import type { DueBillsView } from "./due-bills-view";
import { dueDateLabel } from "./due-date-label";
import { nextDay, occurrenceKey } from "./due-model";
import { billReadiness, type Readiness } from "./due-readiness";
import { markPaidAccounts, occurrenceErrorMessage } from "./mark-paid-model";
import type { UseDue } from "./use-due";

const NO_ENVELOPE: Readiness = { kind: "none" };

/** Everything the Due sections draw and do, from the budget, the bills, and the ledger. */
export function useDueBillsView(
  view: ActiveBudgetView,
  due: UseDue,
  openMarkPaid: (item: V2DueOccurrence) => void,
): DueBillsView {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const mutations = useLedgerMutationsWithSound();
  const { canAddSpending } = useBudgetRole();
  const { currency } = view.budget;
  const lines = envelopeLines(view);
  const readiness = billReadiness(
    due.sections.flatMap((section) => section.items),
    lines,
    currency,
  );

  const skipNow = async (item: V2DueOccurrence) => {
    try {
      await mutations.skipOccurrence(item.ruleId, item.scheduledDate);
      track("bill_skipped", {});
      showToast({ message: `Skipped ${item.name}` });
    } catch (cause) {
      showToast({ message: occurrenceErrorMessage(cause, "skip") });
    }
  };

  return {
    today: due.today,
    budgetCurrency: currency,
    readiness: (item) => readiness.get(occurrenceKey(item)) ?? NO_ENVELOPE,
    iconFor: (categoryId) =>
      categories.data.find((category) => category.id === categoryId)?.icon ?? null,
    accountsFor: (item) => markPaidAccounts(accounts.data, item, view.fundingAccountIds, currency),
    accountName: (accountId) =>
      accounts.data.find((account) => account.id === accountId)?.name ?? null,
    money: (minor) => impactMoney(minor, currency),
    isMuted: (ruleId) => due.reminders.prefs.mutedRuleIds.includes(ruleId),
    canPay: canAddSpending,
    openMarkPaid,
    snooze: (item) => {
      void due.reminders.snooze(item.ruleId, item.scheduledDate, nextDay(due.today));
      showToast({ message: `${item.name} is snoozed until tomorrow` });
    },
    skip: (item) =>
      Alert.alert(
        `Skip ${item.name}?`,
        `Nothing is recorded for ${dueDateLabel(item.scheduledDate)}, and it leaves your Due list.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Skip", style: "destructive", onPress: () => void skipNow(item) },
        ],
      ),
  };
}
