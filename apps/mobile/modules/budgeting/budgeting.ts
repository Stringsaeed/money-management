import type { QueryClient } from "@tanstack/react-query";
import type { SQLiteDatabase } from "expo-sqlite";

import { cohereBudgetingEffects } from "@/modules/ledger-cache";

import { getAccountBudgetDependencies } from "./account-dependencies";
import { activateWorkspace } from "./activation";
import { getFundingAccountSuggestions } from "./funding-account-suggestions";
import { updateFundingMembership } from "./funding-membership";
import { getProjection } from "./projection";
import type {
  ActivateWorkspaceRequest,
  BudgetingCoordinator,
  CurrencySettingRequest,
  FundingAccountSuggestionsRequest,
  ProjectionRequest,
  UpdateFundingMembershipRequest,
} from "./types";
import { getWorkspaceSelection, selectWorkspace, setHomeCurrency } from "./workspace-settings";

interface BudgetingCoordinatorOptions {
  queryClient?: QueryClient;
}

export type {
  ActivateWorkspaceRequest,
  AccountBudgetDependency,
  BudgetAttentionReason,
  BudgetHealth,
  BudgetProjection,
  BudgetShortfallReason,
  BudgetingCoordinator,
  CurrencySettingRequest,
  FundingAccountSuggestion,
  FundingAccountSuggestionsRequest,
  Money,
  ProjectionRequest,
  UnsupportedCurrencyTransferReason,
  Workspace,
  WorkspaceSelection,
  UpdateFundingMembershipRequest,
} from "./types";

export function createBudgetingCoordinator(
  database: SQLiteDatabase,
  options: BudgetingCoordinatorOptions = {},
): BudgetingCoordinator {
  return {
    activateWorkspace: async (request: ActivateWorkspaceRequest) => {
      const projection = await activateWorkspace(database, request);
      if (options.queryClient) {
        await cohereBudgetingEffects(options.queryClient, ["workspaces"]);
      }
      return projection;
    },
    updateFundingMembership: async (request: UpdateFundingMembershipRequest) => {
      const projection = await updateFundingMembership(database, request);
      if (options.queryClient) {
        await cohereBudgetingEffects(options.queryClient, ["memberships"]);
      }
      return projection;
    },
    getFundingAccountSuggestions: (request: FundingAccountSuggestionsRequest) =>
      getFundingAccountSuggestions(database, request),
    getWorkspaceSelection: () => getWorkspaceSelection(database),
    setHomeCurrency: async (request: CurrencySettingRequest) => {
      await setHomeCurrency(database, request);
      if (options.queryClient) {
        await cohereBudgetingEffects(options.queryClient, ["settings"]);
      }
    },
    selectWorkspace: async (request: CurrencySettingRequest) => {
      await selectWorkspace(database, request);
      if (options.queryClient) {
        await cohereBudgetingEffects(options.queryClient, ["settings"]);
      }
    },
    getProjection: (request: ProjectionRequest) => getProjection(database, request),
    getAccountDependencies: (accountId: string, period: string, dependencyOptions) =>
      getAccountBudgetDependencies(database, accountId, period, dependencyOptions),
  };
}
