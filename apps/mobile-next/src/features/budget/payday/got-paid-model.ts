import { BUDGET_CURRENCY, type V2Account, type V2Category } from "@trove/api/v2/contracts";

import { ApiError } from "@/data/http";
import { parseMoneyMinor } from "@/utils/money";

export const SALARY_CATEGORY_NAME = "Salary";

/** Active AED funding accounts: the places a salary can land and count as money to plan. */
export function salaryAccounts(
  accounts: readonly V2Account[],
  fundingAccountIds: readonly string[],
): V2Account[] {
  return accounts.filter(
    (account) =>
      !account.archived &&
      account.currency === BUDGET_CURRENCY &&
      fundingAccountIds.includes(account.id),
  );
}

/** The budget's default account when it can receive a salary, else the first account on offer. */
export function defaultSalaryAccountId(
  choices: readonly V2Account[],
  defaultAccountId: string | null,
): string | null {
  return choices.find((account) => account.id === defaultAccountId)?.id ?? choices[0]?.id ?? null;
}

export const incomeCategories = (categories: readonly V2Category[]): V2Category[] =>
  categories.filter((category) => category.kind === "income" && !category.archived);

/** The income Category named Salary, else the first income Category, else none (create Salary). */
export function defaultIncomeCategoryId(categories: readonly V2Category[]): string | null {
  const income = incomeCategories(categories);
  const salary = income.find(
    (category) => category.name.trim().toLowerCase() === SALARY_CATEGORY_NAME.toLowerCase(),
  );
  return (salary ?? income[0])?.id ?? null;
}

export interface GotPaidDraft {
  readonly amountText: string;
  readonly accountId: string | null;
  readonly date: string;
}

export type GotPaidCheck =
  | { readonly ok: true; readonly amountMinor: number; readonly accountId: string }
  | { readonly ok: false; readonly error: string };

export function checkGotPaid(draft: GotPaidDraft, today: string): GotPaidCheck {
  const amountMinor = parseMoneyMinor(draft.amountText, BUDGET_CURRENCY);
  if (amountMinor === null || amountMinor <= 0) {
    return { ok: false, error: "Enter the salary you received, like 9000 or 9000.50." };
  }
  if (!draft.accountId) return { ok: false, error: "Choose the account the salary went into." };
  if (draft.date > today) return { ok: false, error: "Pick today or the day it landed." };
  return { ok: true, amountMinor, accountId: draft.accountId };
}

/** What went wrong and that nothing was recorded. */
export function gotPaidErrorMessage(cause: unknown): string {
  if (cause instanceof ApiError && cause.code === "network_error") {
    return "You're offline. Nothing was recorded.";
  }
  return "Couldn't log your salary. Nothing was recorded, so try again.";
}

/** The salary starts the new month when it is dated on or after the period's first day. */
export const startsNewMonth = (date: string, periodStart: string): boolean => date >= periodStart;
