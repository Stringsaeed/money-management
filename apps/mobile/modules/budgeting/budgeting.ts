import type { QueryClient } from "@tanstack/react-query";
import type { SQLiteDatabase } from "expo-sqlite";

import { cohereBudgetingEffects } from "@/modules/ledger-cache";

import { activateWorkspace } from "./activation";
import { getProjection } from "./projection";
import type { ActivateWorkspaceRequest, BudgetingCoordinator, ProjectionRequest } from "./types";

interface BudgetingCoordinatorOptions {
  queryClient?: QueryClient;
}

export type {
  ActivateWorkspaceRequest,
  BudgetProjection,
  BudgetingCoordinator,
  Money,
  ProjectionRequest,
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
    getProjection: (request: ProjectionRequest) => getProjection(database, request),
  };
}
