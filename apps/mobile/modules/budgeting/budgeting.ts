import type { QueryClient } from "@tanstack/react-query";
import type { SQLiteDatabase } from "expo-sqlite";

import { cohereBudgetingEffects } from "@/modules/ledger-cache";

import { getAccountBudgetDependencies } from "./account-dependencies";
import {
  correctMoveMoney,
  getAssignmentHistory,
  moveMoney,
  previewCorrectMoveMoney,
  previewMoveMoney,
} from "./assignments";
import { activateWorkspace } from "./activation";
import { getFundingAccountSuggestions } from "./funding-account-suggestions";
import { updateFundingMembership } from "./funding-membership";
import { createEnvelope, updateEnvelope } from "./envelope-resources";
import { getEnvelopeFormOptions } from "./envelope-form-options";
import { getProjection } from "./projection";
import type {
  ActivateWorkspaceRequest,
  BudgetingCoordinator,
  CurrencySettingRequest,
  FundingAccountSuggestionsRequest,
  ProjectionRequest,
  UpdateFundingMembershipRequest,
  CreateEnvelopeRequest,
  UpdateEnvelopeRequest,
  EnvelopeFormOptionsRequest,
  AssignmentHistoryRequest,
  CorrectMoveMoneyRequest,
  MoveMoneyRequest,
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
  CreateEnvelopeRequest,
  UpdateEnvelopeRequest,
  EnvelopeCategoryOption,
  EnvelopeFormOptionsRequest,
  EnvelopeSummary,
  AssignmentHistoryEntry,
  AssignmentHistoryRequest,
  CorrectMoveMoneyRequest,
  MoveMoneyBalance,
  MoveMoneyEndpoint,
  MoveMoneyPreview,
  MoveMoneyRequest,
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
    previewMoveMoney: (request: MoveMoneyRequest) => previewMoveMoney(database, request),
    previewCorrectMoveMoney: (request: CorrectMoveMoneyRequest) =>
      previewCorrectMoveMoney(database, request),
    moveMoney: async (request: MoveMoneyRequest) => {
      const projection = await moveMoney(database, request);
      await cohereAfterCommit(options.queryClient, ["assignments"]);
      return projection;
    },
    correctMoveMoney: async (request: CorrectMoveMoneyRequest) => {
      const projection = await correctMoveMoney(database, request);
      await cohereAfterCommit(options.queryClient, ["assignments"]);
      return projection;
    },
    getAssignmentHistory: (request: AssignmentHistoryRequest) =>
      getAssignmentHistory(database, request),
    getEnvelopeFormOptions: (request: EnvelopeFormOptionsRequest) =>
      getEnvelopeFormOptions(database, request),
    createEnvelope: async (request: CreateEnvelopeRequest) => {
      const projection = await createEnvelope(database, request);
      if (options.queryClient) {
        await cohereBudgetingEffects(options.queryClient, ["envelopes"]);
      }
      return projection;
    },
    updateEnvelope: async (request: UpdateEnvelopeRequest) => {
      const projection = await updateEnvelope(database, request);
      if (options.queryClient) {
        await cohereBudgetingEffects(options.queryClient, ["envelopes"]);
      }
      return projection;
    },
    getAccountDependencies: (accountId: string, period: string, dependencyOptions) =>
      getAccountBudgetDependencies(database, accountId, period, dependencyOptions),
  };
}

async function cohereAfterCommit(
  queryClient: QueryClient | undefined,
  effects: readonly ["assignments"],
): Promise<void> {
  if (!queryClient) return;
  try {
    await cohereBudgetingEffects(queryClient, effects);
  } catch {
    // Durable Assignment facts are already committed. A stale projection can retry independently.
  }
}
