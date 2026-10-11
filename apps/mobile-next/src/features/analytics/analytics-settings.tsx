import { ListGroup, ListRow, Switch } from "@/ui/trove";

import { setAnalyticsSharing } from "./analytics-store";
import { useAnalyticsSharing } from "./use-analytics-sharing";

/** Settings row: opt in or out of anonymous usage analytics. */
export function AnalyticsSettings() {
  const sharing = useAnalyticsSharing();

  return (
    <ListGroup dividerInset={0}>
      <ListRow
        subtitle="Helps us improve budgeting. Never includes amounts, payees, notes, or account names."
        title="Share anonymous usage"
        trailing={
          <Switch
            accessibilityLabel="Share anonymous usage"
            value={sharing}
            onValueChange={setAnalyticsSharing}
          />
        }
      />
    </ListGroup>
  );
}
