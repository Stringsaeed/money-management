import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import type { Account } from "@/types";

export function isCustomAccountIcon(icon: string): boolean {
  return Boolean(icon) && !icon.includes(".");
}

export function accountDisplayIcon(account: Pick<Account, "icon" | "type">): string {
  if (isCustomAccountIcon(account.icon)) {
    return account.icon;
  }

  return ACCOUNT_TYPE_META[account.type]?.emoji ?? "🏧";
}
