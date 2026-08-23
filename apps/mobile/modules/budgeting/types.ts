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

export interface BudgetingCoordinator {
  activateWorkspace(request: ActivateWorkspaceRequest): Promise<BudgetProjection>;
  getProjection(request: ProjectionRequest): Promise<BudgetProjection | null>;
}
