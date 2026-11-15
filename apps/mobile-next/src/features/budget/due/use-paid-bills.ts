import {
  useAccountsQuery,
  useCategoriesQuery,
  useRecurringQuery,
  useTransactionsQuery,
} from "@/data/ledger-queries";

import type { ActiveBudgetView } from "../home/home-model";

import { paidThisPeriod, type PaidBill } from "./due-paid";

/** Bills marked paid in the current Budget Period, from the ledger the Due list belongs to. */
export function usePaidBills(view: ActiveBudgetView): readonly PaidBill[] {
  const { period } = view.current;
  const transactions = useTransactionsQuery({ fromDate: period.start, toDate: period.end });
  const rules = useRecurringQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  return paidThisPeriod({
    transactions: transactions.data,
    rules: rules.data,
    accounts: accounts.data,
    categories: categories.data,
    period,
  });
}
