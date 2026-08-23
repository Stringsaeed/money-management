import { isMatch, isValid } from "date-fns";

import { parseDate } from "@/utils/date";

import { dependencyAttentionReasons } from "./settlement";
import type {
  CreateRecurringRulesOptions,
  RecurringRuleDraft,
  RecurringValidationIssue,
} from "./types";

export async function validateDraft(
  options: CreateRecurringRulesOptions,
  draft: RecurringRuleDraft,
  preservedCategoryId: string | null = null,
): Promise<RecurringValidationIssue[]> {
  const issues: RecurringValidationIssue[] = [];
  if (!draft.name.trim()) issues.push({ field: "name", message: "Enter a Rule name." });
  if (!(["income", "expense", "transfer"] as string[]).includes(draft.type)) {
    issues.push({ field: "type", message: "Choose income, expense, or transfer." });
  }
  if (!Number.isSafeInteger(draft.amountMinor) || draft.amountMinor <= 0) {
    issues.push({ field: "amountMinor", message: "Enter a positive amount in minor units." });
  }
  if (!/^[A-Z]{3}$/.test(draft.currency)) {
    issues.push({ field: "currency", message: "Choose a three-letter ISO currency." });
  }
  if (!Number.isSafeInteger(draft.intervalCount) || draft.intervalCount <= 0) {
    issues.push({ field: "intervalCount", message: "Use a positive recurrence interval." });
  }
  if (!(["day", "week", "month", "year"] as string[]).includes(draft.frequency)) {
    issues.push({ field: "frequency", message: "Choose a supported recurrence frequency." });
  }
  if (!isDateOnly(draft.startDate)) {
    issues.push({ field: "startDate", message: "Choose a valid start date." });
  }
  if (draft.endDate && !isDateOnly(draft.endDate)) {
    issues.push({ field: "endDate", message: "Choose a valid end date." });
  } else if (draft.endDate && draft.endDate < draft.startDate) {
    issues.push({ field: "endDate", message: "End date cannot be before the start date." });
  }
  if (draft.endCount !== null && (!Number.isSafeInteger(draft.endCount) || draft.endCount <= 0)) {
    issues.push({ field: "endCount", message: "Occurrence count must be a positive integer." });
  }
  if (draft.endDate !== null && draft.endCount !== null) {
    issues.push({
      field: "endCount",
      message: "Choose either an end date or an occurrence count.",
    });
  }
  if (!isTimeZone(draft.timeZone)) {
    issues.push({ field: "timeZone", message: "Choose a valid IANA time zone." });
  }
  if (draft.type === "transfer" && draft.toAccountId === draft.accountId) {
    issues.push({ field: "toAccountId", message: "Choose a different destination Account." });
  }
  if (draft.type !== "transfer" && draft.toAccountId !== null) {
    issues.push({
      field: "toAccountId",
      message: "Only transfers can have a destination Account.",
    });
  }
  if (draft.categoryId) {
    const category = await options.database.getFirstAsync<{ id: string; lifecycle: string }>(
      "SELECT id, lifecycle FROM categories WHERE id = ?",
      draft.categoryId,
    );
    if (!category || (category.lifecycle !== "active" && category.id !== preservedCategoryId)) {
      issues.push({ field: "categoryId", message: "Choose an available Category." });
    }
  }

  const dependencyReasons = await dependencyAttentionReasons(options.database, {
    type: draft.type,
    currency: draft.currency,
    accountId: draft.accountId,
    toAccountId: draft.toAccountId,
  });
  for (const reason of dependencyReasons) {
    issues.push({
      field:
        reason.kind === "missing-destination-account" ||
        (reason.kind === "account-currency-changed" && reason.accountId === draft.toAccountId)
          ? "toAccountId"
          : "accountId",
      message:
        reason.kind === "account-currency-changed"
          ? `Account currency ${reason.actual} does not match ${reason.expected}.`
          : "Choose an available Account.",
    });
  }
  return issues;
}

function isDateOnly(value: string): boolean {
  return isMatch(value, "yyyy-MM-dd") && isValid(parseDate(value));
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
