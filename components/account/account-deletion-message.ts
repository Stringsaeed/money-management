import type { AccountDeletionPreview } from "@/modules/account-recurring-coordinator";

export function accountDeletionMessage(
  accountName: string,
  preview: AccountDeletionPreview,
): string {
  const ruleNames = [...new Set(preview.rules.map((impact) => impact.name))];
  const base = `This will permanently delete ${accountName} and all its transactions.`;
  if (ruleNames.length === 0) return `${base} This cannot be undone.`;

  const label = `${ruleNames.length} Recurring ${ruleNames.length === 1 ? "Rule" : "Rules"}`;
  return `${base} ${label} (${ruleNames.join(", ")}) will be archived and need repair. This cannot be undone.`;
}
