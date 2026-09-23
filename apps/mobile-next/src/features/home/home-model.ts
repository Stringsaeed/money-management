import {
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { V2Transaction } from "@trove/api/v2/contracts";

import type { BuildHomeOverviewInput, HomeOverview } from "./home-model-types";

const DATE_ONLY_PATTERN = "yyyy-MM-dd";

interface TransactionEffect {
  readonly date: Date;
  readonly deltaMinor: number;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
}

interface MutableHomeOverviewPoint {
  date: string;
  balanceMinor: number;
  incomeMinor: number;
  expenseMinor: number;
}

/**
 * Builds Home's balance and cash-flow series from the scoped ledger rows.
 * Account balances are replayed from their opening balances so the first
 * visible point remains correct even when the selected range starts later.
 */
export function buildHomeOverview({
  accounts,
  transactions,
  currency,
  range,
  now = new Date(),
  accountId = null,
}: BuildHomeOverviewInput): HomeOverview {
  const today = startOfDay(requireValidDate(now));
  const start = rangeStart(today, range);
  const startDate = format(start, DATE_ONLY_PATTERN);
  const endDate = format(today, DATE_ONLY_PATTERN);
  const selectedAccounts = accounts.filter(
    (account) =>
      !account.archived &&
      account.currency === currency &&
      (accountId === null || account.id === accountId),
  );
  const selectedAccountIds = new Set(selectedAccounts.map((account) => account.id));
  const referenceDate = startOfDay(now);
  let openingBalanceMinor = 0;

  for (const account of selectedAccounts) {
    openingBalanceMinor = addMinor(openingBalanceMinor, account.openingBalanceMinor, currency);
  }

  const effects = transactions
    .map((transaction) =>
      toTransactionEffect(transaction, selectedAccountIds, currency, referenceDate),
    )
    .filter((effect): effect is TransactionEffect => effect !== null)
    .filter((effect) => format(effect.date, DATE_ONLY_PATTERN) <= endDate)
    .sort((left, right) => left.date.getTime() - right.date.getTime());

  const pointDates =
    range === "year"
      ? eachMonthOfInterval({ start: startOfYear(today), end: startOfMonth(today) })
      : eachDayOfInterval({ start, end: today });
  const pointsByKey = new Map<string, MutableHomeOverviewPoint>();
  const points: MutableHomeOverviewPoint[] = pointDates.map((date) => {
    const point = {
      date: format(date, DATE_ONLY_PATTERN),
      balanceMinor: 0,
      incomeMinor: 0,
      expenseMinor: 0,
    } satisfies MutableHomeOverviewPoint;
    pointsByKey.set(bucketKey(date, range), point);
    return point;
  });

  let balanceMinor = openingBalanceMinor;
  let balanceAtRangeStartMinor = openingBalanceMinor;
  let incomeMinor = 0;
  let expenseMinor = 0;

  for (const effect of effects) {
    const effectDate = format(effect.date, DATE_ONLY_PATTERN);
    if (effectDate < startDate) {
      balanceMinor = addMinor(balanceMinor, effect.deltaMinor, currency);
      balanceAtRangeStartMinor = addMinor(balanceAtRangeStartMinor, effect.deltaMinor, currency);
      continue;
    }

    balanceMinor = addMinor(balanceMinor, effect.deltaMinor, currency);
    incomeMinor = addMinor(incomeMinor, effect.incomeMinor, currency);
    expenseMinor = addMinor(expenseMinor, effect.expenseMinor, currency);

    const point = pointsByKey.get(bucketKey(effect.date, range));
    if (point) {
      point.balanceMinor = addMinor(point.balanceMinor, effect.deltaMinor, currency);
      point.incomeMinor = addMinor(point.incomeMinor, effect.incomeMinor, currency);
      point.expenseMinor = addMinor(point.expenseMinor, effect.expenseMinor, currency);
    }
  }

  let pointBalance = balanceAtRangeStartMinor;
  for (const point of points) {
    pointBalance = addMinor(pointBalance, point.balanceMinor, currency);
    point.balanceMinor = pointBalance;
  }

  return {
    balanceMinor,
    incomeMinor,
    expenseMinor,
    points,
    currency,
    startDate,
    endDate,
  };
}

function rangeStart(today: Date, range: BuildHomeOverviewInput["range"]): Date {
  switch (range) {
    case "week":
      return startOfWeek(today, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(today);
    case "year":
      return startOfYear(today);
  }
}

function bucketKey(date: Date, range: BuildHomeOverviewInput["range"]): string {
  return format(date, range === "year" ? "yyyy-MM" : DATE_ONLY_PATTERN);
}

function toTransactionEffect(
  transaction: V2Transaction,
  selectedAccountIds: ReadonlySet<string>,
  currency: string,
  referenceDate: Date,
): TransactionEffect | null {
  if (transaction.currency !== currency) return null;
  const date = parseLedgerDate(transaction.date, referenceDate);
  const sourceSelected = selectedAccountIds.has(transaction.accountId);
  const destinationSelected = transaction.toAccountId
    ? selectedAccountIds.has(transaction.toAccountId)
    : false;

  if (transaction.kind === "transfer") {
    if (!sourceSelected && !destinationSelected) return null;
    let deltaMinor = 0;
    if (sourceSelected) deltaMinor = addMinor(deltaMinor, -transaction.amountMinor, currency);
    if (destinationSelected) deltaMinor = addMinor(deltaMinor, transaction.amountMinor, currency);
    return { date, deltaMinor, incomeMinor: 0, expenseMinor: 0 };
  }
  if (!sourceSelected) return null;

  if (transaction.kind === "income") {
    return {
      date,
      deltaMinor: transaction.amountMinor,
      incomeMinor: transaction.amountMinor,
      expenseMinor: 0,
    };
  }
  return {
    date,
    deltaMinor: -transaction.amountMinor,
    incomeMinor: 0,
    expenseMinor: transaction.amountMinor,
  };
}

function parseLedgerDate(value: string, referenceDate: Date): Date {
  const date = parse(value, DATE_ONLY_PATTERN, referenceDate);
  if (!isValid(date) || format(date, DATE_ONLY_PATTERN) !== value) {
    throw new Error(`Home overview received an invalid ledger date: ${value}.`);
  }
  return startOfDay(date);
}

function requireValidDate(date: Date): Date {
  if (!isValid(date)) throw new Error("Home overview requires a valid current date.");
  return date;
}

function addMinor(left: number, right: number, currency: string): number {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) {
    throw new Error(`${currency} Home overview requires safe integer minor units.`);
  }
  const total = left + right;
  if (!Number.isSafeInteger(total)) {
    throw new Error(`${currency} Home overview exceeds safe integer minor units.`);
  }
  return total;
}
