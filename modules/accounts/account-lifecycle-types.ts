export interface AccountLifecycleRequest {
  accountId: string;
  localDate: string;
  now: string;
}

export interface AccountRuleBlocker {
  ruleId: string;
  name: string;
  relationship: "source" | "destination";
}

interface AccountBudgetDependencyBase {
  currency: string;
  amountMinor: number;
}

export type AccountBudgetDependency =
  | (AccountBudgetDependencyBase & { kind: "budget-shortfall" })
  | (AccountBudgetDependencyBase & { kind: "card-payment-reserve" })
  | (AccountBudgetDependencyBase & { kind: "unfunded-card-spending" });

export type AccountArchiveBlocker =
  | {
      kind: "non-zero-balance";
      balanceMinor: number;
      recoveryAction: "Record transactions or transfers until this Account balance is zero.";
    }
  | {
      kind: "active-recurring-rules";
      rules: AccountRuleBlocker[];
      recoveryAction: "Pause or archive every listed Recurring Rule.";
    }
  | {
      kind: "budget-dependencies";
      dependencies: AccountBudgetDependency[];
      recoveryAction: "Resolve every listed budget dependency before archiving this Account.";
    };

export interface AccountArchivalPreview {
  accountId: string;
  blockers: AccountArchiveBlocker[];
  canArchive: boolean;
}

export interface AccountDeletionPreview {
  accountId: string;
  transactionCount: number;
  recurringRuleCount: number;
  fundingMembershipCount: number;
  budgetHistoryCount: number;
  canDelete: boolean;
}

export class AccountArchiveBlockedError extends Error {
  constructor(readonly preview: AccountArchivalPreview) {
    super(
      `Account ${preview.accountId} cannot be archived until every listed prerequisite is resolved.`,
    );
    this.name = "AccountArchiveBlockedError";
  }
}

export class AccountHasHistoryError extends Error {
  constructor(readonly preview: AccountDeletionPreview) {
    super(
      `Account ${preview.accountId} carries dependent history. Archive it to preserve its financial history.`,
    );
    this.name = "AccountHasHistoryError";
  }
}
