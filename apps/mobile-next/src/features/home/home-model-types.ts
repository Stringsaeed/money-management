import type { V2Account, V2Transaction } from "@trove/api/v2/contracts";

export type HomeOverviewRange = "week" | "month" | "year";

export interface BuildHomeOverviewInput {
  readonly accounts: readonly V2Account[];
  readonly transactions: readonly V2Transaction[];
  readonly currency: string;
  readonly range: HomeOverviewRange;
  readonly now?: Date;
  readonly accountId?: string | null;
}

export interface HomeOverviewPoint {
  readonly date: string;
  readonly balanceMinor: number;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
}

export interface HomeOverview {
  readonly balanceMinor: number;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
  readonly points: readonly HomeOverviewPoint[];
  readonly currency: string;
  readonly startDate: string;
  readonly endDate: string;
}
