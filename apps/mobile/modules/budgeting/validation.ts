import { isMatch, isValid, parseISO } from "date-fns";

export function addMoney(left: number, right: number, currency: string): number {
  requireMinorUnits(left, currency);
  requireMinorUnits(right, currency);
  const sum = left + right;
  if (!Number.isSafeInteger(sum)) {
    throw new Error(`${currency} Funding Pool exceeds safe integer minor units.`);
  }
  return sum;
}

export function requireMinorUnits(amount: number, currency: string): void {
  if (!Number.isSafeInteger(amount)) {
    throw new Error(`${currency} Money must use safe integer minor units.`);
  }
}

export function requireCurrency(currency: string): string {
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`Budget currency must be a three-letter ISO code, received ${currency}.`);
  }
  return currency;
}

export function requireDistinctAccountIds(accountIds: readonly string[]): string[] {
  if (accountIds.length === 0) {
    throw new Error("Budget activation requires at least one Funding Account.");
  }
  const uniqueIds = [...new Set(accountIds)];
  if (uniqueIds.length !== accountIds.length || uniqueIds.some((id) => id.length === 0)) {
    throw new Error("Budget activation requires distinct non-empty Funding Account IDs.");
  }
  return uniqueIds;
}

export function periodForLocalDate(localDate: string): string {
  if (!isMatch(localDate, "yyyy-MM-dd") || !isValid(parseISO(localDate))) {
    throw new Error(`Budget activation requires a valid local Ledger Date, received ${localDate}.`);
  }
  return localDate.slice(0, 7);
}

export function requirePeriod(period: string): string {
  if (!isMatch(`${period}-01`, "yyyy-MM-dd") || !isValid(parseISO(`${period}-01`))) {
    throw new Error(`Budget Period must use yyyy-MM, received ${period}.`);
  }
  return period;
}
