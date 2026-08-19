export const GUIDED_SETUP_DRAFT_ID = "guided-envelope-setup";

export interface SetupDraftFundingAccount {
  id: string;
  name: string;
  currency: string;
  type: "checking" | "savings" | "cash";
  icon: string;
  color: string;
  balanceMinor: number;
}

export interface SetupDraftCategorySuggestion {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SetupDraftPrerequisites {
  fundingAccounts: SetupDraftFundingAccount[];
  categories: SetupDraftCategorySuggestion[];
  currencies: string[];
}

export interface SetupDraftEnvelope {
  id: string;
  currency: string;
  name: string;
  icon: string;
  color: string;
  categoryIds: string[];
  positiveRollover: boolean;
  initialAssignmentMinor: number;
}

export interface SetupDraftWorkspace {
  currency: string;
  fundingAccountIds: string[];
  envelopes: SetupDraftEnvelope[];
}

export interface SetupDraft {
  version: 1;
  id: string;
  mode: "suggested" | "blank";
  step: "plan" | "review";
  workspaces: SetupDraftWorkspace[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSetupDraftRequest {
  id?: string;
  mode: SetupDraft["mode"];
  currencies: readonly string[];
  now: string;
}
