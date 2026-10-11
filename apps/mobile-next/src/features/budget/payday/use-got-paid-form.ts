import { router } from "expo-router";
import { useState } from "react";

import { track } from "@/features/analytics";
import { useAccountsQuery, useCategoriesQuery, useLedgerMutations } from "@/data/ledger-queries";
import { useTransactionSummaryQuery } from "@/data/transaction-list-queries";
import { useLedgerMutationsWithSound } from "@/features/sound";
import { showToast } from "@/ui/trove";
import { decimalFromMinor } from "@/utils/money";

import { budgetToday } from "../due/due-model";
import { BUDGET_HOME_ROUTE, nextPaydayStep, paydayFlowFacts } from "./payday-flow";
import type { ActiveBudgetView } from "../home/home-model";

import {
  checkGotPaid,
  defaultIncomeCategoryId,
  defaultSalaryAccountId,
  gotPaidErrorMessage,
  incomeCategories,
  salaryAccounts,
  gotPaidTiming,
  SALARY_CATEGORY_NAME,
  startsNewMonth,
} from "./got-paid-model";

/** C0: the salary's amount, account, date and income Category, and posting it as one income. */
export function useGotPaidForm(view: ActiveBudgetView) {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const { createCategory } = useLedgerMutations();
  const { createTransaction } = useLedgerMutationsWithSound();
  const { budget, current } = view;

  const [amountText, setAmountText] = useState(
    budget.usualSalaryMinor ? decimalFromMinor(budget.usualSalaryMinor, budget.currency) : "",
  );
  const [pickedAccountId, setAccountId] = useState<string | null>(null);
  const [pickedCategoryId, setCategoryId] = useState<string | null>(null);
  const today = budgetToday(current);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  // Only the period's first income runs the payday ritual (wrap-up, leftovers, plan).
  const incomeThisPeriod = useTransactionSummaryQuery({
    kinds: ["income"],
    accountIds: view.fundingAccountIds,
    from: current.period.start,
    to: today,
  });

  const accountChoices = salaryAccounts(accounts.data, view.fundingAccountIds, budget.currency);
  const accountId =
    pickedAccountId ?? defaultSalaryAccountId(accountChoices, budget.defaultAccountId);
  const categoryChoices = incomeCategories(categories.data);
  const categoryId = pickedCategoryId ?? defaultIncomeCategoryId(categories.data);

  const submit = async () => {
    if (busy) return;
    const check = checkGotPaid({ amountText, accountId, date }, budget.currency, today);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(undefined);
    setBusy(true);
    const firstIncome = (incomeThisPeriod.data?.count ?? 0) === 0;
    try {
      const incomeCategoryId =
        categoryId ?? (await createCategory({ name: SALARY_CATEGORY_NAME, kind: "income" })).id;
      await createTransaction({
        kind: "income",
        accountId: check.accountId,
        categoryId: incomeCategoryId,
        amountMinor: check.amountMinor,
        date,
        note: SALARY_CATEGORY_NAME,
      });
    } catch (cause) {
      const message = gotPaidErrorMessage(cause);
      setError(message);
      showToast({ message });
      return;
    } finally {
      setBusy(false);
    }
    track("got_paid_logged", { timing: gotPaidTiming(date, current.period.start) });
    showToast({ message: "Salary logged. It's now money you can plan." });
    if (!startsNewMonth(date, current.period.start) || !firstIncome) {
      router.dismissTo(BUDGET_HOME_ROUTE);
      return;
    }
    router.replace(nextPaydayStep("gotPaid", paydayFlowFacts(view)));
  };

  return {
    amountText,
    setAmountText,
    accountChoices,
    accountId,
    setAccountId,
    categoryChoices,
    categoryId,
    setCategoryId,
    date,
    setDate,
    today,
    busy,
    error,
    submit,
  };
}
