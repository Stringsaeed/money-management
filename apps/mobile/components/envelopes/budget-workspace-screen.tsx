import { BudgetOverviewScreen } from "@/components/envelopes/budget-overview-screen";
import { WorkspaceRouteStatus } from "@/components/envelopes/workspace-route-status";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useBudgetWorkspaceSelection } from "@/hooks/use-budget-workspaces";

export const BudgetWorkspaceScreen = () => {
  const selection = useBudgetWorkspaceSelection();

  if (selection.isLoading) {
    return <WorkspaceRouteStatus loadingLabel="Loading currency workspaces" />;
  }

  if (selection.error) {
    return (
      <WorkspaceRouteStatus
        action={
          <Button
            accessibilityLabel="Retry currency workspaces"
            onPress={() => selection.refetch()}
            variant="outline"
          >
            <Text>Retry</Text>
          </Button>
        }
        title="Currency workspaces are unavailable"
        message="Your Funding Pools could not be loaded. Return to Envelopes and try again."
      />
    );
  }

  const workspaceSelection = selection.data;
  if (!workspaceSelection || workspaceSelection.workspaces.length === 0) {
    return (
      <WorkspaceRouteStatus
        title="No currency workspace yet"
        message="Confirm Envelopes setup before choosing a Funding Pool."
      />
    );
  }

  return <BudgetOverviewScreen selection={workspaceSelection} />;
};
