export interface Money {
  currency: string;
  amountMinor: number;
}

export interface BudgetProjection {
  currency: string;
  period: string;
  fundingPool: Money;
  unassignedMoney: Money;
  budgetHealth: BudgetHealth;
  envelopes: EnvelopeSummary[];
  archivedEnvelopes: EnvelopeSummary[];
}

export interface EnvelopeAttentionReason {
  kind: "missing-active-expense-category";
  recoveryAction: "Map at least one active expense Category to this Envelope.";
}

export type EnvelopeHealth =
  | { status: "ready"; reasons: readonly [] }
  | { status: "needs_attention"; reasons: readonly EnvelopeAttentionReason[] };

export interface EnvelopeSummary {
  id: string;
  currency: string;
  name: string;
  icon: string;
  color: string;
  lifecycle: "active" | "archived";
  sortOrder: number;
  categoryIds: string[];
  positiveRollover: boolean;
  health: EnvelopeHealth;
  availableMoney: Money;
  assignedMoney: Money;
  netSpent: Money;
}

export interface CreateEnvelopeRequest {
  id: string;
  currency: string;
  name: string;
  icon: string;
  color: string;
  categoryIds: readonly string[];
  positiveRollover: boolean;
  sortOrder?: number;
  localDate: string;
  now: string;
  confirmedRestoredCategoryIds?: readonly string[];
}

export interface UpdateEnvelopeRequest {
  envelopeId: string;
  name: string;
  icon: string;
  color: string;
  categoryIds: readonly string[];
  positiveRollover: boolean;
  sortOrder?: number;
  localDate: string;
  now: string;
  confirmedRestoredCategoryIds?: readonly string[];
}

export interface EnvelopeFormOptionsRequest {
  currency: string;
  period: string;
}

export interface EnvelopeCategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  mappedEnvelopeId: string | null;
  mappedThroughPeriod: string | null;
  futureMappedEnvelopeId: string | null;
  futureMappingPeriod: string | null;
  requiresConfirmation: boolean;
  eligible: boolean;
  ineligibilityReason: "incompatible-currency" | null;
}

export interface UnsupportedCurrencyTransferReason {
  kind: "unsupported-cross-currency-transfer";
  transactionId: string;
  sourceCurrency: string;
  destinationCurrency: string;
  recoveryAction: "Replace this transfer with exact same-currency ledger records.";
}

export interface BudgetShortfallReason extends Money {
  kind: "budget-shortfall";
  recoveryAction: "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.";
}

export type BudgetAttentionReason = BudgetShortfallReason | UnsupportedCurrencyTransferReason;

export type BudgetHealth =
  | { status: "ready"; reasons: readonly [] }
  | { status: "needs_attention"; reasons: readonly BudgetAttentionReason[] };

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

export interface UpdateFundingMembershipRequest {
  accountId: string;
  included: boolean;
  localDate: string;
  now: string;
}

export interface FundingAccountSuggestionsRequest {
  currency: string;
}

export interface FundingAccountSuggestion {
  id: string;
  currency: string;
  type: "checking" | "savings" | "cash" | "credit_card" | "investment" | "other";
  excludedFromHomeTotal: boolean;
  suggested: boolean;
}

export interface Workspace {
  currency: string;
  activationPeriod: string;
}

export interface WorkspaceSelection {
  workspaces: Workspace[];
  homeCurrency: string | null;
  hasExplicitHomeCurrency: boolean;
  selectedCurrency: string | null;
}

export interface CurrencySettingRequest {
  currency: string;
}

interface AccountBudgetDependencyBase extends Money {
  recoveryAction: string;
}

export type AccountBudgetDependency =
  | (AccountBudgetDependencyBase & { kind: "budget-shortfall" })
  | (AccountBudgetDependencyBase & { kind: "cash-envelope-overspending" })
  | (AccountBudgetDependencyBase & { kind: "card-payment-reserve" })
  | (AccountBudgetDependencyBase & { kind: "unfunded-card-spending" })
  | (AccountBudgetDependencyBase & {
      kind: "unsupported-cross-currency-transfer";
      destinationCurrency: string;
      transactionId: string;
    });

export interface AccountDependencyOptions {
  endingMembership?: boolean;
}

export interface BudgetingCoordinator {
  activateWorkspace(request: ActivateWorkspaceRequest): Promise<BudgetProjection>;
  updateFundingMembership(request: UpdateFundingMembershipRequest): Promise<BudgetProjection>;
  getFundingAccountSuggestions(
    request: FundingAccountSuggestionsRequest,
  ): Promise<FundingAccountSuggestion[]>;
  getWorkspaceSelection(): Promise<WorkspaceSelection>;
  setHomeCurrency(request: CurrencySettingRequest): Promise<void>;
  selectWorkspace(request: CurrencySettingRequest): Promise<void>;
  getProjection(request: ProjectionRequest): Promise<BudgetProjection | null>;
  createEnvelope(request: CreateEnvelopeRequest): Promise<BudgetProjection>;
  updateEnvelope(request: UpdateEnvelopeRequest): Promise<BudgetProjection>;
  getEnvelopeFormOptions(request: EnvelopeFormOptionsRequest): Promise<EnvelopeCategoryOption[]>;
  getAccountDependencies(
    accountId: string,
    period: string,
    options?: AccountDependencyOptions,
  ): Promise<AccountBudgetDependency[]>;
}
