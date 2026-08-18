export interface Money {
  currency: string;
  amountMinor: number;
}

export interface BudgetProjection {
  currency: string;
  period: string;
  fundingPool: Money;
  unassignedMoney: Money;
}

export interface ActivateWorkspaceRequest {
  currency: string;
  fundingAccountIds: readonly string[];
  localDate: string;
  now: string;
}

export interface ProjectionRequest {
  currency: string;
  period: string;
}

interface AccountBudgetDependencyBase extends Money {
  recoveryAction: string;
}

export type AccountBudgetDependency =
  | (AccountBudgetDependencyBase & { kind: "budget-shortfall" })
  | (AccountBudgetDependencyBase & { kind: "cash-envelope-overspending" })
  | (AccountBudgetDependencyBase & { kind: "card-payment-reserve" })
  | (AccountBudgetDependencyBase & { kind: "unfunded-card-spending" });

export interface BudgetingCoordinator {
  activateWorkspace(request: ActivateWorkspaceRequest): Promise<BudgetProjection>;
  getProjection(request: ProjectionRequest): Promise<BudgetProjection | null>;
  getAccountDependencies(accountId: string, period: string): Promise<AccountBudgetDependency[]>;
}
