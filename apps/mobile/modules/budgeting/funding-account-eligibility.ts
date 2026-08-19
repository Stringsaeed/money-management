import type { AccountType } from "@/types";

export type EligibleFundingAccountType = Extract<
  AccountType,
  "checking" | "savings" | "cash" | "other"
>;

const ELIGIBLE_FUNDING_ACCOUNT_TYPES = new Set<AccountType>([
  "checking",
  "savings",
  "cash",
  "other",
]);
const DEFAULT_FUNDING_ACCOUNT_TYPES = new Set<AccountType>(["checking", "savings", "cash"]);

export function isEligibleFundingAccountType(type: string): type is EligibleFundingAccountType {
  return ELIGIBLE_FUNDING_ACCOUNT_TYPES.has(type as AccountType);
}

export function isDefaultFundingAccountType(type: string): boolean {
  return DEFAULT_FUNDING_ACCOUNT_TYPES.has(type as AccountType);
}
